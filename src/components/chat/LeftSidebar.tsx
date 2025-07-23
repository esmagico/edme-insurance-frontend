import {
  FiPlus,
  FiMessageSquare,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { ChatSession } from "./ChatLayout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useRef, useCallback, useEffect } from "react";

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chatSessions: ChatSession[];
  currentChatId: string | null; // Keep as currentChatId for prop compatibility
  onNewChat: () => void;
  onLoadChat: (sessionId: string) => void;
}

export const LeftSidebar = ({
  isOpen,
  onToggle,
  chatSessions,
  currentChatId,
  onNewChat,
  onLoadChat,
}: LeftSidebarProps) => {
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const recentChats = chatSessions.slice(0, 10);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setWidth(newWidth);
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={sidebarRef}
      className={`relative border-r border-border/50 bg-background/95 backdrop-blur-sm flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? "" : "w-16"
      }`}
      style={isOpen ? { width: `${width}px` } : undefined}
    >
      {/* Top Section with Toggle and New Chat */}
      <div className="flex flex-col gap-3 p-4 border-b border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={`w-full p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all duration-200 group ${
            isOpen ? "justify-start" : "justify-center"
          }`}
        >
          {isOpen ? (
            <FiChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <FiChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
          {isOpen && (
            <span className="ml-3 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Collapse sidebar
            </span>
          )}
        </Button>

        <Button
          onClick={onNewChat}
          className={`w-full gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl rounded-xl p-3 transition-all duration-200 font-medium ${
            isOpen ? "justify-start" : "justify-center"
          }`}
          size={isOpen ? "default" : "sm"}
        >
          <FiPlus className="h-4 w-4" />
          {isOpen && <span className="text-sm">New conversation</span>}
        </Button>
      </div>

      {/* Chats Section */}
      {isOpen && (
        <div className="flex-1 overflow-hidden">
          <div className="px-4 py-4">
            <div className="flex items-center gap-2.5">
              <FiMessageSquare className="h-4 w-4 text-muted-foreground/70" />
              <span className="text-xs font-semibold text-muted-foreground/90 uppercase tracking-wider">
                Recent Conversations
              </span>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)] px-2">
            {recentChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                  <FiMessageSquare className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No conversations yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Start a new conversation to get started
                </p>
              </div>
            ) : (
              <div className="space-y-1 px-2">
                {recentChats.map((session) => (
                  <Button
                    key={`recent-${session.id}`}
                    variant="ghost"
                    className={`w-full justify-start p-0 h-auto text-left relative rounded-xl transition-all duration-200 group border border-transparent ${
                      currentChatId === session.id
                        ? "bg-white shadow-md border-border/20"
                        : "hover:bg-white hover:shadow-sm"
                    }`}
                    onClick={() => onLoadChat(session.id)}
                  >
                    <div className="w-full p-3 relative">
                      <div
                        className={`absolute left-0 top-2 bottom-2 w-1 rounded-full transition-colors duration-200 ${
                          currentChatId === session.id
                            ? "bg-blue-600"
                            : "bg-transparent"
                        }`}
                      />
                      <div className="truncate pl-3">
                        <div
                          className={`text-sm font-medium truncate transition-colors ${
                            currentChatId === session.id
                              ? "text-foreground"
                              : "text-foreground/80 group-hover:text-foreground"
                          }`}
                        >
                          {session?.messages[0]?.query || "New conversation"}
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-muted-foreground/40"></div>
                            {session.messages.length} message
                            {session.messages.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Collapsed State Icons */}
      {!isOpen && (
        <div className="flex flex-col items-center gap-4 pt-4">
          <FiMessageSquare className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </div>
      )}

      {/* Resize Handle */}
      {isOpen && (
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors group"
          onMouseDown={handleMouseDown}
        >
          <div className="w-full h-full group-hover:bg-primary/40" />
        </div>
      )}
    </div>
  );
};
