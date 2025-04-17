
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Laptop, PowerOff, ArrowLeft, Music, Play, Pause } from "lucide-react";
import { Link } from "react-router-dom";
import { Task } from "@/types/tasks";
import { cn } from "@/lib/utils";

interface FocusSessionHeaderProps {
  lowPowerMode: boolean;
  toggleLowPowerMode: () => void;
  operationInProgress: boolean;
  currentTask?: Task | null;
  currentTrack?: {title: string; artist?: string} | null;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

const FocusSessionHeader = ({ 
  lowPowerMode, 
  toggleLowPowerMode, 
  operationInProgress,
  currentTask,
  currentTrack,
  isPlaying,
  onTogglePlay
}: FocusSessionHeaderProps) => {
  const { theme, setTheme } = useTheme();
  
  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-[1.1rem] w-[1.1rem]" />;
      case 'dark': return <Moon className="h-[1.1rem] w-[1.1rem]" />;
      default: return <Laptop className="h-[1.1rem] w-[1.1rem]" />;
    }
  };
  
  const cycleTheme = () => {
    switch (theme) {
      case 'light':
        setTheme('dark');
        break;
      case 'dark':
        setTheme('system');
        break;
      default:
        setTheme('light');
        break;
    }
  };

  return (
    <div className="flex justify-between items-center w-full mb-4 sm:mb-6">
      <div className="flex items-center">
        <Link to="/dashboard" className="mr-2">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold mr-2">Focus Session</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        {currentTrack && (
          <div className={cn(
            "hidden sm:flex items-center bg-background/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs mr-2 transition-opacity",
            isPlaying ? "opacity-100" : "opacity-70"
          )}>
            <Music className="h-3 w-3 mr-2 flex-shrink-0" />
            <span className="truncate max-w-[150px]">
              {currentTrack.title}
            </span>
            {onTogglePlay && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 ml-1"
                onClick={onTogglePlay}
              >
                {isPlaying ? 
                  <Pause className="h-3 w-3" /> : 
                  <Play className="h-3 w-3" />
                }
              </Button>
            )}
          </div>
        )}
        
        <Button 
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          disabled={operationInProgress}
          onClick={toggleLowPowerMode}
        >
          <PowerOff className={cn(
            "h-4 w-4",
            lowPowerMode ? "text-green-500" : "text-gray-400"
          )} />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full"
          onClick={cycleTheme}
        >
          {getThemeIcon()}
        </Button>
      </div>
    </div>
  );
};

export default FocusSessionHeader;
