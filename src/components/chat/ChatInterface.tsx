import { useState, useRef, useEffect } from "react";
import {
  FiSend,
  FiPaperclip,
  FiMic,
  FiMicOff,
  FiLoader,
  FiFileText,
} from "react-icons/fi";
import { Message, ResponseData, Citation, UploadedFile } from "./ChatLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "./ThemeToggle";
import axios from "axios";

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, fileName?: string, message?: Message) => void;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
  sessionId: string | null;
  setJsonData: (jsonData: any) => void;
  setJsonLoading: (loading: boolean) => void;
  currentSessionJsonData: any;
  onUpdateSessionFiles: (files: UploadedFile[]) => void;
  currentSessionFiles: UploadedFile[];
}

// API configuration

export const ChatInterface = ({
  messages,
  onSendMessage,
  isDark,
  setIsDark,
  sessionId,
  setJsonData,
  setJsonLoading,
  currentSessionJsonData,
  onUpdateSessionFiles,
  currentSessionFiles,
}: ChatInterfaceProps) => {
  const [inputText, setInputText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [baseText, setBaseText] = useState("");
  const [pendingMessage, setPendingMessage] = useState<{
    query: string;
    isLoading: boolean;
  } | null>(null);
  const [viewingFile, setViewingFile] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef<string>("");
  const { toast } = useToast();

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join("");

          // Use a ref to get the current baseText value
          setInputText((currentInput) => {
            const currentBaseText = baseTextRef.current;
            return (
              currentBaseText +
              (currentBaseText && transcript ? " " : "") +
              transcript
            );
          });
        };

        recognition.onerror = (event) => {
          console.log("Speech recognition error:", event.error);
          setIsListening(false);
          toast({
            title: "Speech recognition error",
            description:
              "Please try again or check your microphone permissions",
            variant: "destructive",
          });
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  // Auto-scroll to bottom whenever messages or pending message changes
  useEffect(() => {
    if (messageContainerRef.current) {
      const scrollContainer = messageContainerRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, pendingMessage]);

  const handleExtractPolicyData = () => {
    setIsExtracting(true);
    setJsonLoading(true);
    axios
      .post(`${baseUrl}/extractPolicyData`, {
        session_id: sessionId,
      })
      .then((res) => {
        console.log(res.data);
        setJsonData(res.data?.structured_data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setIsExtracting(false);
        setJsonLoading(false);
      });
  };

  const handlePopulateSession = () => {
    setIsPopulating(true);
    axios
      .post(`${baseUrl}/populateSession`, {
        session_id: sessionId,
      })
      .then((res) => {
        console.log(res.data);
        handleExtractPolicyData();
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setIsPopulating(false);
      });
  };

  const handleQuestionAnswer = async (question: string) => {
    // Show question immediately with loading state
    setPendingMessage({ query: question, isLoading: true });
    setIsAnswering(true);

    try {
      const response = await axios.post(`${baseUrl}/fetchResponse`, {
        session_id: sessionId,
        text: question,
      });

      // Store the full response data
      const responseData = response.data?.response;

      // Create message with query and full response data
      const newMessage = {
        query: question,
        response: responseData || "No response received",
      };

      // Clear pending message and add complete message
      setPendingMessage(null);
      onSendMessage(question, undefined, newMessage);

      return response.data;
    } catch (err) {
      console.log(err);
      toast({
        title: "Error",
        description: "Failed to get response from AI",
        variant: "destructive",
      });

      // Add error message and clear pending
      const errorMessage = {
        query: question,
        response: "Sorry, I couldn't process your question. Please try again.",
      };
      setPendingMessage(null);
      onSendMessage(question, undefined, errorMessage);
    } finally {
      setIsAnswering(false);
    }
  };

  // API call to upload document
  const uploadDocument = async (file: File): Promise<boolean> => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Session ID is required for file upload",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsUploading(true);
      
      // Read file content for display
      const fileContent = await readFileContent(file);
      
      const formData = new FormData();
      formData.append("files", file);
      formData.append("session_id", sessionId);

      const response = await fetch(`${baseUrl}/uploadDocument`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary for FormData
      });

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      
      // Add uploaded file to session
      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        content: fileContent,
      };
      
      const updatedFiles = [...currentSessionFiles, uploadedFile];
      onUpdateSessionFiles(updatedFiles);
      
      // Create a file upload message in chat
      const fileMessage: Message = {
        query: `Uploaded file: ${file.name}`,
        response: `File "${file.name}" (${(file.size / 1024).toFixed(1)}KB) has been uploaded successfully and is being processed.`,
        attachedFile: uploadedFile,
      };
      
      onSendMessage(`Uploaded file: ${file.name}`, file.name, fileMessage);
      
      handlePopulateSession();

      return true;
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to read file content based on file type
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      
      // Handle different file types
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        // For images and PDFs, read as data URL for display
        reader.readAsDataURL(file);
      } else {
        // For text files, read as text
        reader.readAsText(file);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputText.trim() && selectedFiles.length === 0) return;

    // If there are files, upload them first
    if (selectedFiles.length > 0) {
      const uploadPromises = selectedFiles.map((file) => uploadDocument(file));
      const uploadResults = await Promise.all(uploadPromises);

      // Check if all uploads were successful
      const failedUploads = uploadResults.filter((result) => !result).length;
      if (failedUploads > 0) {
        toast({
          title: "Some uploads failed",
          description: `${failedUploads} out of ${selectedFiles.length} files failed to upload`,
          variant: "destructive",
        });
        return; // Don't send message if uploads failed
      }
    }

    const messageText = inputText.trim() || "Files uploaded";
    const fileNames = selectedFiles.map((file) => file.name).join(", ");

    // If there's text input and files have been uploaded, send it as a question
    if (inputText.trim() !== "" && currentSessionJsonData) {
      await handleQuestionAnswer(inputText.trim());
    }

    // Reset form
    setInputText("");
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSpeechRecognition = () => {
    if (!speechSupported || !recognitionRef.current) {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        // Store current input text as base text when starting speech recognition
        const currentText = inputText;
        setBaseText(currentText);
        baseTextRef.current = currentText;
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast({
          title: "Could not start listening",
          description: "Please check your microphone permissions",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-chat-bg">
      <div className="h-[61px] flex items-center justify-between px-4 border-b border-chat-border bg-chat-bg">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">AI Chat Assistant</h1>
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FiLoader className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          )}
          {isPopulating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FiLoader className="h-4 w-4 animate-spin" />
              Populating...
            </div>
          )}
          {isExtracting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FiLoader className="h-4 w-4 animate-spin" />
              Extracting...
            </div>
          )}
          {isAnswering && !isUploading && !isPopulating && !isExtracting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FiLoader className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          )}
        </div>
        <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
      </div>

      {/* Messages Area with Auto-scroll */}
      <div
        ref={messageContainerRef}
        className="flex-1 p-4 overflow-y-auto scroll-smooth"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">
                {isUploading || isPopulating || isExtracting ? "⏳" : "📄"}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {isUploading || isPopulating || isExtracting
                  ? "Processing your document..."
                  : !currentSessionJsonData
                  ? "Upload a document to get started"
                  : "Start a conversation"}
              </h3>
              <p className="text-muted-foreground">
                {isUploading || isPopulating || isExtracting
                  ? "Please wait while we are getting JSON data from your file"
                  : !currentSessionJsonData
                  ? "Please upload a document first, then you can ask questions about it"
                  : "Send a message to begin chatting with the AI assistant"}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={index} className="space-y-4">
                  {/* User Query */}
                  <div className="flex justify-end">
                    <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg animate-fade-in bg-message-user text-message-user-fg">
                      <div className="text-sm">{message.query}</div>
                      {/* File Attachment */}
                      {message.attachedFile && (
                        <div className="mt-2 p-2 bg-black/10 dark:bg-white/10 rounded border">
                          <button
                            onClick={() => setViewingFile(message.attachedFile!)}
                            className="flex items-center gap-2 text-xs hover:underline mb-2"
                          >
                            {message.attachedFile.type.startsWith('image/') ? (
                              <span className="text-green-500">🖼️</span>
                            ) : message.attachedFile.type === 'application/pdf' ? (
                              <span className="text-red-500">📄</span>
                            ) : (
                              <FiFileText className="h-3 w-3" />
                            )}
                            <span>{message.attachedFile.name}</span>
                            <span className="text-opacity-70">
                              ({(message.attachedFile.size / 1024).toFixed(1)}KB)
                            </span>
                          </button>
                          {/* Image Preview */}
                          {message.attachedFile.type.startsWith('image/') && (
                            <div className="mt-1">
                              <img
                                src={message.attachedFile.content}
                                alt={message.attachedFile.name}
                                className="max-w-full max-h-32 object-contain rounded cursor-pointer"
                                onClick={() => setViewingFile(message.attachedFile!)}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assistant Response */}
                  <div className="flex justify-start">
                    <div className="max-w-2xl lg:max-w-3xl px-4 py-3 rounded-lg animate-fade-in bg-message-assistant text-message-assistant-fg border border-border">
                      {typeof message.response === "string" ? (
                        <div className="text-sm">{message.response}</div>
                      ) : (
                        <div className="space-y-3">
                          {/* Main Answer */}
                          <div className="text-sm">
                            {message.response.answer}
                          </div>

                          {/* Confidence Score */}
                          {message.response.confidence && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                              <span>Confidence:</span>
                              <div className="flex items-center gap-1">
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      message.response.confidence.score >= 0.7
                                        ? "bg-green-500"
                                        : message.response.confidence.score >=
                                          0.4
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{
                                      width: `${
                                        message.response.confidence.score * 100
                                      }%`,
                                    }}
                                  />
                                </div>
                                <span>
                                  {Math.round(
                                    message.response.confidence.score * 100
                                  )}
                                  %
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Citations */}
                          {message.response.citations &&
                            message.response.citations.length > 0 && (
                              <div className="space-y-2 border-t pt-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                  Sources ({message.response.citations.length}):
                                </div>
                                <div className="space-y-2">
                                  {message.response.citations.map(
                                    (citation, citationIndex) => (
                                      <div
                                        key={citationIndex}
                                        className="bg-muted/50 rounded p-2 text-xs"
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-1">
                                            <FiFileText className="h-3 w-3" />
                                            <span className="font-medium text-foreground">
                                              {citation.document_name}
                                            </span>
                                          </div>
                                          <span className="text-muted-foreground">
                                            {Math.round(
                                              citation.confidence.score * 100
                                            )}
                                            % confidence
                                          </span>
                                        </div>
                                        <div className="text-muted-foreground">
                                          {citation.text_snippet}
                                        </div>
                                      </div>
                                    )
                                  )}
                                  {/* {message.response.citations.length > 3 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{message.response.citations.length - 3}{" "}
                                      more sources
                                    </div>
                                  )} */}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pending Message with Skeleton Loader */}
              {pendingMessage && (
                <div className="space-y-4">
                  {/* User Query - Shows Immediately */}
                  <div className="flex justify-end">
                    <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg animate-fade-in bg-message-user text-message-user-fg">
                      <div className="text-sm">{pendingMessage.query}</div>
                    </div>
                  </div>

                  {/* Skeleton Loader for Assistant Response */}
                  <div className="flex justify-start">
                    <div className="max-w-2xl lg:max-w-3xl px-4 py-3 rounded-lg animate-fade-in bg-message-assistant text-message-assistant-fg border border-border">
                      <div className="space-y-3">
                        {/* Main answer skeleton */}
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse"></div>
                          <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                          <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                        </div>

                        {/* Confidence skeleton */}
                        <div className="border-t pt-2">
                          <div className="flex items-center gap-2">
                            <div className="h-3 bg-muted rounded animate-pulse w-16"></div>
                            <div className="h-2 bg-muted rounded animate-pulse w-16"></div>
                            <div className="h-3 bg-muted rounded animate-pulse w-8"></div>
                          </div>
                        </div>

                        {/* Sources skeleton */}
                        <div className="border-t pt-2 space-y-2">
                          <div className="h-3 bg-muted rounded animate-pulse w-20"></div>
                          <div className="bg-muted/50 rounded p-2 space-y-1">
                            <div className="h-3 bg-muted rounded animate-pulse w-32"></div>
                            <div className="h-3 bg-muted rounded animate-pulse"></div>
                            <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-chat-border bg-chat-bg px-4 py-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          {/* File Upload Status */}
          {!currentSessionJsonData && selectedFiles.length === 0 && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                {isUploading || isPopulating || isExtracting ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    <span>
                      Please wait while we are getting JSON data from your file...
                    </span>
                  </>
                ) : (
                  <>
                    <FiPaperclip className="h-4 w-4" />
                    <span>
                      Upload a document to start chatting with the AI assistant
                    </span>
                  </>
                )}
              </div>
            </div>
          )}



          {/* Selected Files Display - Above Input */}
          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              {/* <div className="text-sm text-muted-foreground flex items-center gap-2">
                <FiPaperclip className="h-4 w-4" />
                Selected {selectedFiles.length} file
                {selectedFiles.length > 1 ? "s" : ""}:
              </div> */}
              <div className="flex gap-2 items-center">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2 bg-muted px-2 py-1 rounded-md text-xs"
                  >
                    <FiPaperclip className="h-4 w-4" />
                    <span className="max-w-32 truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      disabled={
                        isUploading ||
                        isPopulating ||
                        isExtracting ||
                        isAnswering
                      }
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs h-auto p-1 text-muted-foreground hover:text-foreground"
                disabled={
                  isUploading || isPopulating || isExtracting || isAnswering
                }
              >
                Clear all files
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  !currentSessionJsonData
                    ? "Please upload a document first..."
                    : "How can I help you today?"
                }
                className="flex-1"
                disabled={
                  !currentSessionJsonData ||
                  isUploading ||
                  isPopulating ||
                  isExtracting ||
                  isAnswering
                }
              />

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
                multiple
                disabled={isUploading || isPopulating || isExtracting}
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
                disabled={
                  isUploading || isPopulating || isExtracting || isAnswering
                }
              >
                <FiPaperclip className="h-4 w-4" />
              </Button>

              {speechSupported && (
                <Button
                  type="button"
                  variant={isListening ? "default" : "outline"}
                  size="icon"
                  onClick={toggleSpeechRecognition}
                  className={`shrink-0 ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                      : ""
                  }`}
                  disabled={
                    !currentSessionJsonData ||
                    isUploading ||
                    isPopulating ||
                    isExtracting ||
                    isAnswering
                  }
                >
                  {isListening ? (
                    <FiMicOff className="h-4 w-4" />
                  ) : (
                    <FiMic className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                (!currentSessionJsonData && selectedFiles.length === 0) ||
                (!inputText.trim() && selectedFiles.length === 0) ||
                isUploading ||
                isPopulating ||
                isExtracting ||
                isAnswering
              }
              className="shrink-0"
            >
              {isUploading || isPopulating || isExtracting || isAnswering ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiSend className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* File Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`bg-background border border-border rounded-lg w-full flex flex-col ${
            viewingFile.type === 'application/pdf' 
              ? 'max-w-6xl h-[95vh]' 
              : viewingFile.type.startsWith('image/')
              ? 'max-w-6xl max-h-[90vh]'
              : 'max-w-4xl max-h-[80vh]'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FiFileText className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">{viewingFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(viewingFile.size / 1024).toFixed(1)}KB • {viewingFile.type} • 
                    Uploaded {viewingFile.uploadedAt.toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingFile(null)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className={`flex-1 overflow-auto ${viewingFile.type === 'application/pdf' ? '' : 'p-4'}`}>
              {viewingFile.type.startsWith('image/') ? (
                <div className="flex justify-center h-full">
                  <img 
                    src={viewingFile.content} 
                    alt={viewingFile.name}
                    className="max-w-full max-h-full object-contain rounded border"
                  />
                </div>
              ) : viewingFile.type === 'application/pdf' ? (
                <iframe
                  src={viewingFile.content}
                  className="w-full h-full border-0"
                  title={viewingFile.name}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/50 p-4 rounded border">
                  {viewingFile.content || "No content available"}
                </pre>
              )}
            </div>
            
            {/* Modal Footer */}
            {viewingFile.type !== 'application/pdf' && (
              <div className="flex justify-end gap-2 p-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setViewingFile(null)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
