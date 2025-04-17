
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Battery, BatteryLow, Menu, Music, Play, Pause } from "lucide-react";
import { Task } from "@/types/tasks";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface FocusSessionHeaderProps {
  lowPowerMode: boolean;
  toggleLowPowerMode: () => void;
  operationInProgress: boolean;
  currentTask?: Task | null;
  currentTrack: {title: string, artist?: string} | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
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
  const [showMenu, setShowMenu] = useState(false);
  const isMobile = useIsMobile();
  
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLowPowerMode}
          disabled={operationInProgress}
          className="mr-1 sm:mr-2"
          aria-label={lowPowerMode ? "Switch to enhanced mode" : "Switch to low power mode"}
        >
          {lowPowerMode ? (
            <BatteryLow className="h-5 w-5" />
          ) : (
            <Battery className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2">
        {currentTrack && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePlay}
              aria-label={isPlaying ? "Pause music" : "Play music"}
              className="relative"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              <Music className="h-3 w-3 absolute bottom-1 right-1" />
            </Button>
            
            {!isMobile && (
              <span className="text-xs truncate max-w-[100px]">
                {currentTrack.title}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusSessionHeader;
