
import { ArrowLeft, Battery, BatteryCharging, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Task } from "@/types/tasks";
import { useIsMobile } from "@/hooks/use-mobile";

interface FocusSessionHeaderProps {
  lowPowerMode: boolean;
  toggleLowPowerMode: () => void;
  operationInProgress: boolean;
  currentTask?: Task | null;
}

const FocusSessionHeader = ({ 
  lowPowerMode, 
  toggleLowPowerMode, 
  operationInProgress,
  currentTask
}: FocusSessionHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Get priority color for badge
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };
  
  // Get priority icon
  const getPriorityIcon = (priority?: string) => {
    const className = "h-3 w-3 mr-1";
    switch (priority) {
      case "high": return <Flag className={`${className} text-red-600`} />;
      case "medium": return <Flag className={`${className} text-yellow-600`} />;
      case "low": return <Flag className={`${className} text-green-600`} />;
      default: return <Flag className={`${className} text-gray-600`} />;
    }
  };

  return (
    <div className="flex items-center justify-between mb-2 sm:mb-4">
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full"
        onClick={() => navigate('/dashboard')}
      >
        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
      
      {currentTask ? (
        <div className={`flex items-center bg-white/80 backdrop-blur-sm ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-full shadow-sm max-w-[65%] sm:max-w-md overflow-hidden`}>
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mr-1 sm:mr-2 whitespace-nowrap`}>Current:</span>
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} truncate`}>{currentTask.title}</span>
          <span className={`ml-1 sm:ml-2 inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(currentTask.priority)}`}>
            {getPriorityIcon(currentTask.priority)}
            <span className={isMobile ? "sr-only" : "ml-0.5"}>{currentTask.priority}</span>
          </span>
        </div>
      ) : (
        <div className="flex items-center bg-white/80 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-sm">
          <span className="text-xs sm:text-sm font-medium text-gray-600">No task selected</span>
        </div>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full"
        onClick={toggleLowPowerMode}
        disabled={operationInProgress}
      >
        {lowPowerMode ? (
          <Battery className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <BatteryCharging className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </Button>
    </div>
  );
};

export default FocusSessionHeader;
