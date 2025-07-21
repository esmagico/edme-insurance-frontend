import { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip } from 'react-icons/fi';
import { Message } from './ChatLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from './ThemeToggle';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, fileName?: string) => void;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
}

export const ChatInterface = ({ messages, onSendMessage, isDark, setIsDark }: ChatInterfaceProps) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (messageContainerRef.current) {
      const scrollContainer = messageContainerRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() && !selectedFile) return;

    const messageText = inputText.trim() || 'File uploaded';
    const fileName = selectedFile?.name;

    onSendMessage(messageText, fileName);
    
    // Reset form
    setInputText('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "File selected",
        description: `"${file.name}" is ready to send`,
      });
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-chat-bg">
      <div className="h-[61px] flex items-center justify-between px-4 border-b border-chat-border bg-chat-bg">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">AI Chat Assistant</h1>
        </div>
        <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
      </div>

      {/* Messages Area with Auto-scroll */}
      <div 
        ref={messageContainerRef}
        className="flex-1 p-4 overflow-y-auto scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground">
                Send a message to begin chatting with the AI assistant
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg animate-fade-in ${
                    message.type === 'user'
                      ? 'bg-message-user text-message-user-fg'
                      : 'bg-message-assistant text-message-assistant-fg border border-border'
                  }`}
                >
                  <div className="text-sm">{message.text}</div>
                  {message.fileName && (
                    <div className="text-xs mt-2 opacity-80 flex items-center gap-1">
                      <FiPaperclip className="h-3 w-3" />
                      {message.fileName}
                    </div>
                  )}
                  <div className="text-xs mt-2 opacity-60">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-chat-border bg-chat-bg p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="How can I help you today?"
                className="flex-1"
              />
              
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
              >
                <FiPaperclip className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={!inputText.trim() && !selectedFile}
              className="shrink-0"
            >
              <FiSend className="h-4 w-4" />
            </Button>
          </form>
          
          {selectedFile && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
              <FiPaperclip className="h-3 w-3" />
              Selected: {selectedFile.name}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-xs h-auto p-1"
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};