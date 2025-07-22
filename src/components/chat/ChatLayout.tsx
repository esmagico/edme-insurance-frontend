import { useState, useEffect } from "react";
import { LeftSidebar } from "./LeftSidebar";
import { ChatInterface } from "./ChatInterface";
import { RightSidebar } from "./RightSidebar";
import { ThemeToggle } from "./ThemeToggle";
import axios from "axios";
export interface Message {
  query: string;
  response: string;
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
  const [jsonData, setJsonData] = useState<any>(null);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [allSessions, setAllSessions] = useState([]);

  console.log(messages, "messages");
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const handleStartSession = () => {
    axios
      .post(`${baseUrl}/startSession`, {})
      .then((res) => {
        setSessionId(res.data.session_id);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getAllChats = () => {
    axios
      .get(`${baseUrl}/getAllSessions`)
      .then((res) => {
        setAllSessions(res.data.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  console.log(allSessions, "allSessions");

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
    getAllChats();
    handleStartSession();
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

  const handleSendMessage = (
    text: string,
    fileName?: string,
    message?: Message
  ) => {
    const newMessage: Message = message || {
      query: text,
      response: `I received your message: "${text}"${
        fileName ? ` and file: ${fileName}` : ""
      }. This is a demo response.`,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Update current chat session or create new one
    if (currentChatId) {
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === currentChatId
            ? {
                ...session,
                messages: [...session.messages, newMessage],
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
    handleStartSession();
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

  console.log(jsonData, "jsonData");

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
          sessionId={sessionId}
          setJsonData={setJsonData}
          setJsonLoading={setJsonLoading}
        />
      </div>

      {/* Right Sidebar */}
      {messages.length > 0 && (
        <RightSidebar
          isOpen={rightSidebarOpen}
          onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
          jsonData={jsonData}
          loading={jsonLoading}
        />
      )}
    </div>
  );
};
