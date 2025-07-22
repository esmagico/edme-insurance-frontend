import { useState, useRef, useEffect } from "react";
import { FiSend, FiPaperclip, FiMic, FiMicOff, FiLoader } from "react-icons/fi";
import { Message } from "./ChatLayout";
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
}

// API configuration


export const ChatInterface = ({
  messages,
  onSendMessage,
  isDark,
  setIsDark,
  sessionId,
  setJsonData,
  setJsonLoading
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
          console.error("Speech recognition error:", event.error);
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

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (messageContainerRef.current) {
      const scrollContainer = messageContainerRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleExtractPolicyData = () => {
    setIsExtracting(true);
    axios.post(`${baseUrl}/extractPolicyData`, {
      session_id: sessionId,
    })
    .then((res) => {
      console.log(res.data);
      setJsonData(res.data?.structured_data);
      console.log(res.data, "handleExtractPolicyData")
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setIsExtracting(false);
      setJsonLoading(false);
    });
  }

  const handlePopulateSession = () => {
    setIsPopulating(true);
    axios.post(`${baseUrl}/populateSession`, {
      session_id: sessionId,
    })
    .then((res) => {
      console.log(res.data);
      handleExtractPolicyData();
      console.log(res.data, "handlePopulateSession")
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setIsPopulating(false);
    });
  }

  const handleQuestionAnswer = async (question: string) => {
    setIsAnswering(true);
    setJsonLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/fetchResponse`, {
        session_id: sessionId,
        text: question,
      });
      const answer = response.data?.response?.answer
      
      // Create message with query and response
      const newMessage = {
        query: question,
        response: answer || "No response received"
      };
      
      // Add message using the onSendMessage callback
      onSendMessage(question, undefined, newMessage);
      
      return response.data;
    } catch (err) {
      console.log(err);
      toast({
        title: "Error",
        description: "Failed to get response from AI",
        variant: "destructive",
      });
      
      // Add error message
      const errorMessage = {
        query: question,
        response: "Hello Answer Nhi Milega"
      };
      onSendMessage(question, undefined, errorMessage);
    } finally {
      setIsAnswering(false);
    }
  }

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
      console.log(file,"file")
      const formData = new FormData();
      formData.append('files', file);
      formData.append('session_id', sessionId);

      const response = await fetch(`${baseUrl}/uploadDocument`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary for FormData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      handlePopulateSession();

      return true;
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputText.trim() && selectedFiles.length === 0) return;

    // If there are files, upload them first
    if (selectedFiles.length > 0) {
      const uploadPromises = selectedFiles.map(file => uploadDocument(file));
      const uploadResults = await Promise.all(uploadPromises);
      
      // Check if all uploads were successful
      const failedUploads = uploadResults.filter(result => !result).length;
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

    // If there's text input, send it as a question
    if (inputText.trim() !== "") {
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
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">
                Start a conversation
              </h3>
              <p className="text-muted-foreground">
                Send a message to begin chatting with the AI assistant
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="space-y-4">
                {/* User Query */}
                <div className="flex justify-end">
                  <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg animate-fade-in bg-message-user text-message-user-fg">
                    <div className="text-sm">{message.query}</div>
                  </div>
                </div>
                
                {/* Assistant Response */}
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg animate-fade-in bg-message-assistant text-message-assistant-fg border border-border">
                    <div className="text-sm">{message.response}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-chat-border bg-chat-bg px-4 py-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
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
                      disabled={isUploading || isPopulating || isExtracting || isAnswering}
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
                disabled={isUploading || isPopulating || isExtracting || isAnswering}
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
                placeholder="How can I help you today?"
                className="flex-1"
                disabled={isUploading || isPopulating || isExtracting || isAnswering}
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
                disabled={isUploading || isPopulating || isExtracting || isAnswering}
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
                  disabled={isUploading || isPopulating || isExtracting || isAnswering}
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
              disabled={(!inputText.trim() && selectedFiles.length === 0) || isUploading || isPopulating || isExtracting || isAnswering}
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
    </div>
  );
};