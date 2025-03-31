
import { ArrowLeft, Battery, BatteryCharging, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Task } from "@/types/tasks";

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
    <div className="flex items-center justify-between mb-6">
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full"
        onClick={() => navigate('/dashboard')}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      
      {currentTask && (
        <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
          <span className="text-sm font-medium mr-2">Current Focus:</span>
          <span className="text-sm">{currentTask.title}</span>
          <span className={`ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(currentTask.priority)}`}>
            {getPriorityIcon(currentTask.priority)}
            {currentTask.priority}
          </span>
        </div>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full"
        onClick={toggleLowPowerMode}
        disabled={operationInProgress}
      >
        {lowPowerMode ? (
          <Battery className="h-5 w-5" />
        ) : (
          <BatteryCharging className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};

export default FocusSessionHeader;
