import { FiCode, FiCopy, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useCallback, useEffect } from "react";

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  jsonData: any;
  loading: boolean;
}

export const RightSidebar = ({
  isOpen,
  onToggle,
  jsonData,
  loading,
}: RightSidebarProps) => {
  const { toast } = useToast();
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
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

  const handleCopyJson = async () => {
    try {
      const jsonString = JSON.stringify(jsonData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      toast({
        title: "Copied to clipboard",
        description: "JSON data copied successfully",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy JSON to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={`relative border-l border-sidebar-border bg-sidebar-bg ${
        isOpen ? "" : "w-16"
      } ${!isOpen ? "transition-all duration-300 ease-in-out" : ""}`}
      style={isOpen ? { width: `${width}px` } : undefined}
    >
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center gap-2">
              <FiCode className="h-4 w-4" />
              <span className="text-sm font-medium">JSON Output</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2 hover:bg-muted"
          >
            {isOpen ? (
              <FiChevronRight className="h-4 w-4" />
            ) : (
              <FiChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {isOpen ? (
        <div className="flex-1 flex flex-col">
          {/* Copy Button */}
          <div className="p-3 border-b border-sidebar-border">
            <Button
              onClick={handleCopyJson}
              variant="outline"
              size="sm"
              className="w-full gap-2"
              disabled={loading || !jsonData}
            >
              <FiCopy className="h-4 w-4" />
              {loading ? "Loading..." : "Copy JSON"}
            </Button>
          </div>

          {/* JSON Display */}
          <div className="flex-1 p-3 overflow-y-auto scroll-smooth">
            {loading ? (
              <div className="h-[calc(100vh-200px)] bg-muted rounded-lg p-3 flex flex-col justify-center items-center">
                <div className="space-y-4 w-full">
                  {/* Loading Animation */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">
                      Loading JSON...
                    </span>
                  </div>

                  {/* Skeleton Lines */}
                  <div className="space-y-3">
                    <div className="h-3 bg-muted-foreground/20 rounded animate-pulse"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-1/2"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-5/6"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-2/3"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded animate-pulse"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-4/5"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-1/3"></div>
                  </div>
                </div>
              </div>
            ) : (
              <pre className="h-[calc(100vh-200px)] text-xs bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap min-h-0">
                <code>{JSON.stringify(jsonData, null, 2)}</code>
              </pre>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 pt-4">
          <FiCode className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      {/* Resize Handle */}
      {isOpen && (
        <div
          className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors group"
          onMouseDown={handleMouseDown}
        >
          <div className="w-full h-full group-hover:bg-primary/40" />
        </div>
      )}
    </div>
  );
};
