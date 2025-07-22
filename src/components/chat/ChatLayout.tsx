import { useState, useEffect } from "react";
import { LeftSidebar } from "./LeftSidebar";
import { ChatInterface } from "./ChatInterface";
import { RightSidebar } from "./RightSidebar";
import { ThemeToggle } from "./ThemeToggle";

export interface Message {
  id: string;
  text: string;
  fileName?: string;
  type: "user" | "assistant";
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

export const ChatLayout = () => {
  const [isDark, setIsDark] = useState(() => {
    // Initialize from localStorage or default to false
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("darkMode");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [jsonOutput, setJsonOutput] = useState<any>({
    messages: [],
    currentSession: null,
    timestamp: new Date().toISOString(),
  });

  // Create initial chat session on mount
  useEffect(() => {
    if (chatSessions.length === 0) {
      const initialChatId = Date.now().toString();
      const initialSession: ChatSession = {
        id: initialChatId,
        title: "New Chat",
        timestamp: new Date(),
        messages: [],
      };

      setChatSessions([initialSession]);
      setCurrentChatId(initialChatId);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Dark mode effect with localStorage persistence
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Save to localStorage
    localStorage.setItem("darkMode", JSON.stringify(isDark));
  }, [isDark]);

  // Update JSON output when messages change
  useEffect(() => {
    setJsonOutput({
      messages: messages,
      currentSession: currentChatId,
      timestamp: new Date().toISOString(),
      totalMessages: messages.length,
      chatSessions: chatSessions.length,
    });
  }, [messages, currentChatId, chatSessions]);

  const handleSendMessage = (text: string, fileName?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      fileName,
      type: "user",
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: `I received your message: "${text}"${
        fileName ? ` and file: ${fileName}` : ""
      }. This is a demo response.`,
      type: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage, assistantMessage]);

    // Update current chat session or create new one
    if (currentChatId) {
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === currentChatId
            ? {
                ...session,
                messages: [...session.messages, newMessage, assistantMessage],
              }
            : session
        )
      );
    }
  };

  const startNewChat = () => {
    const newChatId = Date.now().toString();
    const newSession: ChatSession = {
      id: newChatId,
      title: `New Chat`,
      timestamp: new Date(),
      messages: [],
    };

    setChatSessions((prev) => [newSession, ...prev]);
    setCurrentChatId(newChatId);
    setMessages([]);
  };

  const loadChatSession = (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentChatId(sessionId);
      setMessages(session.messages);
    }
  };

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Left Sidebar */}
      <LeftSidebar
        isOpen={leftSidebarOpen}
        onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
        chatSessions={chatSessions}
        currentChatId={currentChatId}
        onNewChat={startNewChat}
        onLoadChat={loadChatSession}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isDark={isDark}
          setIsDark={setIsDark}
        />
      </div>

      {/* Right Sidebar */}
      {messages.length > 0 && (
        <RightSidebar
          isOpen={rightSidebarOpen}
          onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
          jsonData={jsonOutput}
        />
      )}
    </div>
  );
};
