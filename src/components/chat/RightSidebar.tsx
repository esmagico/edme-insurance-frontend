import { FiCode, FiCopy, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  jsonData: any;
}

export const RightSidebar = ({ isOpen, onToggle, jsonData }: RightSidebarProps) => {
  const { toast } = useToast();

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
    <div className={`transition-all duration-300 ease-in-out border-l border-sidebar-border bg-sidebar-bg ${
      isOpen ? 'w-80' : 'w-16'
    }`}>
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
            {isOpen ? <FiChevronRight className="h-4 w-4" /> : <FiChevronLeft className="h-4 w-4" />}
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
            >
              <FiCopy className="h-4 w-4" />
              Copy JSON
            </Button>
          </div>

          {/* JSON Display */}
          <ScrollArea className="flex-1 p-3">
            <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
              <code>{JSON.stringify(jsonData, null, 2)}</code>
            </pre>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 pt-4">
          <FiCode className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};