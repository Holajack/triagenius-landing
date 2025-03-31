
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface FocusMilestonesProps {
  currentMilestone: number;
  currentProgress: number;
  lowPowerMode: boolean;
}

const FocusMilestones = ({ 
  currentMilestone, 
  currentProgress, 
  lowPowerMode 
}: FocusMilestonesProps) => {
  const [milestones, setMilestones] = useState(Array(3).fill(false));
  
  useEffect(() => {
    const newMilestones = milestones.map((_, index) => index < currentMilestone);
    setMilestones(newMilestones);
  }, [currentMilestone]);

  return (
    <div className="w-full relative">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Focus Milestones</h3>
        <span className="text-xs text-gray-500">{currentMilestone} of 3 completed</span>
      </div>
      
      <div className="relative">
        {/* Background progress bar */}
        <div className="h-2 bg-gray-200 rounded-full mb-4" />
        
        {/* Dynamic progress indicator */}
        <div 
          className="absolute top-0 h-2 bg-blue-500 rounded-full transition-all duration-300 ease-out"
          style={{ 
            width: `${Math.min((currentMilestone / 3) * 100 + (currentProgress / 100) * (100/3), 100)}%`,
            opacity: lowPowerMode ? 0.7 : 1
          }}
        />
        
        {/* Milestone markers */}
        <div className="absolute top-0 left-0 right-0 flex justify-between transform -translate-y-1/2">
          {[1, 2, 3].map((milestone, index) => {
            const isCompleted = index < currentMilestone;
            const isCurrent = index === currentMilestone;
            
            return (
              <div 
                key={milestone}
                className={cn(
                  "flex flex-col items-center",
                  isCurrent && !lowPowerMode && "animate-pulse"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center z-10",
                    isCompleted ? "bg-blue-600 text-white" : "bg-gray-200",
                    isCurrent && "ring-2 ring-blue-300 ring-offset-2"
                  )}
                >
                  {isCompleted && <Trophy className="w-3 h-3" />}
                </div>
                
                {!lowPowerMode && (
                  <span className={cn(
                    "text-xs mt-1",
                    isCompleted ? "font-medium text-blue-600" : "text-gray-500",
                    isCurrent && "font-medium text-blue-500"
                  )}>
                    {milestone * 45}m
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FocusMilestones;
