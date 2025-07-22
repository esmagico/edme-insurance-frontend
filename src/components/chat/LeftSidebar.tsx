import { FiPlus, FiMessageSquare, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { ChatSession } from './ChatLayout';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useRef, useCallback, useEffect } from 'react';

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chatSessions: ChatSession[];
  currentChatId: string | null;
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= 500) {
      setWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={sidebarRef}
      className={`relative border-r border-sidebar-border bg-sidebar-bg flex flex-col ${
        isOpen ? '' : 'w-16'
      } ${!isOpen ? 'transition-all duration-300 ease-in-out' : ''}`}
      style={isOpen ? { width: `${width}px` } : undefined}
    >
      {/* Top Section with Toggle and New Chat */}
      <div className="flex flex-col gap-2 p-4 border-b border-sidebar-border bg-background/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-start p-2.5 hover:bg-accent/10 rounded-lg"
        >
          {isOpen ? <FiChevronLeft className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}
          {isOpen && <span className="ml-2 font-medium">Collapse sidebar</span>}
        </Button>

        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm rounded-lg p-2.5"
          size={isOpen ? "default" : "sm"}
        >
          <FiPlus className="h-5 w-5" />
          {isOpen && <span className="font-medium">New conversation</span>}
        </Button>
      </div>

      {/* Chats Section */}
      {isOpen && (
        <div className="flex-1 overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
              <FiMessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground/90">Recent Conversations</span>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-180px)] px-2">
            {recentChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click 'New conversation' to get started</p>
              </div>
            ) : (
              <div className="space-y-1 px-2">
                {recentChats.map((session) => (
                  <Button
                    key={`recent-${session.id}`}
                    variant={currentChatId === session.id ? "secondary" : "ghost"}
                    className={`w-full justify-start p-3 h-auto text-left relative rounded-lg transition-all ${
                      currentChatId === session.id 
                        ? 'bg-background shadow-sm ring-1 ring-accent/20' 
                        : 'hover:bg-accent/10 hover:shadow-sm'
                    }`}
                    onClick={() => onLoadChat(session.id)}
                  >
                    {currentChatId === session.id && (
                      <div className="absolute left-0 top-[10%] bottom-[10%] w-1 bg-primary rounded-full" />
                    )}
                    <div className="truncate pl-2">
                      <div className="text-base font-medium truncate text-foreground/90">
                        {session?.messages[0]?.text || "New conversation"}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                        {/* <span>{new Date(session.timestamp).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span> */}
                        {/* <span className="text-xs">•</span> */}
                        <span>{session.messages.length} messages</span>
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