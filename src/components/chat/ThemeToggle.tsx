import { FiSun, FiMoon } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export const ThemeToggle = ({ isDark, onToggle }: ThemeToggleProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="h-9 w-9 p-0"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <FiSun className="h-4 w-4 text-yellow-500" />
      ) : (
        <FiMoon className="h-4 w-4 text-slate-600" />
      )}
    </Button>
  );
};