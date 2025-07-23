import { useState, useEffect } from "react";
import { LeftSidebar } from "./LeftSidebar";
import { ChatInterface } from "./ChatInterface";
import { RightSidebar } from "./RightSidebar";
import { ThemeToggle } from "./ThemeToggle";
import axios from "axios";
export interface Citation {
  confidence: {
    score: number;
  };
  document_name: string;
  text_snippet: string;
}

export interface ResponseData {
  answer: string;
  citations: Citation[];
  confidence: {
    justification: string;
    score: number;
  };
}

export interface Message {
  query: string;
  response: string | ResponseData;
  attachedFile?: UploadedFile;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  content?: string; // Store file content for viewing
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
  jsonData?: any;
  uploadedFiles?: UploadedFile[];
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
  const [jsonData, setJsonData] = useState<any>(null);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [allSessions, setAllSessions] = useState([]);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const handleStartSession = async () => {
    try {
      const res = await axios.post(`${baseUrl}/startSession`, {});
      setSessionId(res.data.session_id);
      return res.data.session_id;
    } catch (err) {
      console.log(err);
      return null;
    }
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

  // console.log(allSessions, "allSessions");

  // Create initial chat session on mount
  useEffect(() => {
    const initializeChat = async () => {
      if (chatSessions.length === 0) {
        const newSessionId = await handleStartSession();
        const initialSession: ChatSession = {
          id: newSessionId || Date.now().toString(),
          title: "New Chat",
          timestamp: new Date(),
          messages: [],
          jsonData: null,
          uploadedFiles: [],
        };

        setChatSessions([initialSession]);
      }
      getAllChats();
    };

    initializeChat();
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
    if (sessionId) {
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                messages: [...session.messages, newMessage],
              }
            : session
        )
      );
    }
  };

  const handleUpdateSessionJsonData = (newJsonData: any) => {
    setJsonData(newJsonData);

    // Update current chat session's jsonData
    if (sessionId) {
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                jsonData: newJsonData,
              }
            : session
        )
      );
    }
  };

  const handleUpdateSessionFiles = (newFiles: UploadedFile[]) => {
    // Update current chat session's uploaded files
    if (sessionId) {
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                uploadedFiles: newFiles,
              }
            : session
        )
      );
    }
  };

  const startNewChat = async () => {
    const newSessionId = await handleStartSession(); // Get new sessionId
    const newSession: ChatSession = {
      id: newSessionId || Date.now().toString(),
      title: `New Chat`,
      timestamp: new Date(),
      messages: [],
      jsonData: null,
      uploadedFiles: [],
    };
    setChatSessions((prev) => [newSession, ...prev]);
    setMessages([]);
    setJsonData(null); // Clear current jsonData for new session
  };

  const loadChatSession = (loadSessionId: string) => {
    const session = chatSessions.find((s) => s.id === loadSessionId);
    if (session) {
      setSessionId(loadSessionId);
      setMessages(session.messages);
      setJsonData(session.jsonData || null); // Load session's jsonData
    }
  };

  console.log(chatSessions, "chatSessions");

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Left Sidebar */}
      <LeftSidebar
        isOpen={leftSidebarOpen}
        onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
        chatSessions={chatSessions}
        currentChatId={sessionId}
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
          setJsonData={handleUpdateSessionJsonData}
          setJsonLoading={setJsonLoading}
          currentSessionJsonData={jsonData}
          onUpdateSessionFiles={handleUpdateSessionFiles}
          currentSessionFiles={
            chatSessions.find((s) => s.id === sessionId)?.uploadedFiles || []
          }
        />
      </div>

      {/* Right Sidebar */}
      {jsonData && (
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
