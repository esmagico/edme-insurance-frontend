import {
  FiCode,
  FiCopy,
  FiChevronLeft,
  FiChevronRight,
  FiAlignLeft,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useCallback, useEffect } from "react";

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  jsonData: any;
  loading: boolean;
  isDark: boolean;
}

export const RightSidebar = ({
  isOpen,
  onToggle,
  jsonData,
  loading,
  isDark,
}: RightSidebarProps) => {
  const { toast } = useToast();
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [isFormatted, setIsFormatted] = useState(true);
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
      const jsonString = isFormatted
        ? JSON.stringify(jsonData, null, 2)
        : JSON.stringify(jsonData);
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

  const handleFormatToggle = () => {
    setIsFormatted(!isFormatted);
    toast({
      title: isFormatted ? "JSON Minified" : "JSON Formatted",
      description: isFormatted
        ? "JSON is now displayed in compact format"
        : "JSON is now displayed with proper indentation",
    });
  };

  // Theme-aware JSON syntax highlighting
  const syntaxHighlightJson = (json: string) => {
    if (isDark) {
      // Dark theme colors (VS Code dark)
      return json
        .replace(/(".*?")\s*:/g, '<span style="color: #9CDCFE">$1</span>:') // Keys - light blue
        .replace(/:\s*(".*?")/g, ': <span style="color: #CE9178">$1</span>') // String values - orange
        .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color: #B5CEA8">$1</span>') // Numbers - light green
        .replace(
          /:\s*(true|false)/g,
          ': <span style="color: #569CD6">$1</span>'
        ) // Booleans - blue
        .replace(/:\s*(null)/g, ': <span style="color: #569CD6">$1</span>') // Null - blue
        .replace(/([{}[\]])/g, '<span style="color: #FFD700">$1</span>') // Brackets - gold
        .replace(/(,)/g, '<span style="color: #D4D4D4">$1</span>'); // Commas - light gray
    } else {
      // Light theme colors (VS Code light)
      return json
        .replace(/(".*?")\s*:/g, '<span style="color: #0451A5">$1</span>:') // Keys - dark blue
        .replace(/:\s*(".*?")/g, ': <span style="color: #A31515">$1</span>') // String values - dark red
        .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color: #098658">$1</span>') // Numbers - dark green
        .replace(
          /:\s*(true|false)/g,
          ': <span style="color: #0000FF">$1</span>'
        ) // Booleans - blue
        .replace(/:\s*(null)/g, ': <span style="color: #0000FF">$1</span>') // Null - blue
        .replace(/([{}[\]])/g, '<span style="color: #000000">$1</span>') // Brackets - black
        .replace(/(,)/g, '<span style="color: #000000">$1</span>'); // Commas - black
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
          {/* Action Buttons */}
          <div className="p-3 border-b border-sidebar-border space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={handleFormatToggle}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                disabled={loading || !jsonData}
              >
                <FiAlignLeft className="h-4 w-4" />
                {isFormatted ? "Minify" : "Format"}
              </Button>
              <Button
                onClick={handleCopyJson}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                disabled={loading || !jsonData}
              >
                <FiCopy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>

          {/* JSON Display */}
          <div className="flex-1 p-3 overflow-y-auto scroll-smooth">
            {loading ? (
              <div
                className={`h-[calc(100vh-200px)] rounded-lg p-4 flex flex-col justify-center items-center ${
                  isDark ? "bg-slate-900" : "bg-gray-50"
                }`}
              >
                <div className="space-y-4 w-full">
                  {/* Loading Animation */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <div
                      className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
                        isDark ? "border-blue-400" : "border-blue-600"
                      }`}
                    ></div>
                    <span
                      className={`text-sm ${
                        isDark ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      Loading JSON...
                    </span>
                  </div>

                  {/* Skeleton Lines */}
                  <div className="space-y-3">
                    <div
                      className={`h-3 rounded animate-pulse ${
                        isDark ? "bg-slate-700" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`h-3 rounded animate-pulse w-3/4 ${
                        isDark ? "bg-slate-700" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`h-3 rounded animate-pulse w-1/2 ${
                        isDark ? "bg-slate-700" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`h-3 rounded animate-pulse w-5/6 ${
                        isDark ? "bg-slate-700" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`h-3 rounded animate-pulse w-2/3 ${
                        isDark ? "bg-slate-700" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`h-3 rounded animate-pulse ${
                        isDark ? "bg-slate-700" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`h-3 rounded animate-pulse w-4/5 ${
                        isDark ? "bg-slate-700" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`h-3 rounded animate-pulse w-1/3 ${
                        isDark ? "bg-slate-700" : "bg-gray-300"
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`relative h-[calc(100vh-200px)] rounded-lg overflow-hidden ${
                  isDark ? "bg-slate-900" : "bg-gray-50"
                }`}
              >
                {/* Copy Button - Top Right */}
                <Button
                  onClick={handleCopyJson}
                  variant="ghost"
                  size="sm"
                  className={`absolute top-3 right-3 z-10 h-8 w-8 p-0 border ${
                    isDark
                      ? "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-600/50"
                      : "bg-white/80 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300/50"
                  }`}
                  disabled={!jsonData}
                >
                  <FiCopy className="h-3.5 w-3.5" />
                </Button>

                {/* JSON Content with Syntax Highlighting */}
                <pre
                  className={`h-full text-[12px] font-mono p-4 overflow-auto leading-relaxed ${
                    isDark ? "text-slate-300" : "text-slate-800"
                  }`}
                >
                  <code
                    dangerouslySetInnerHTML={{
                      __html: syntaxHighlightJson(
                        isFormatted
                          ? JSON.stringify(jsonData, null, 2)
                          : JSON.stringify(jsonData)
                      ),
                    }}
                  />
                </pre>
              </div>
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
