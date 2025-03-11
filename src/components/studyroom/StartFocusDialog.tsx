
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Timer, Clock, Plus, Minus } from "lucide-react";

interface StartFocusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartSession: (duration: number) => void;
}

export const StartFocusDialog = ({ 
  open, 
  onOpenChange, 
  onStartSession 
}: StartFocusDialogProps) => {
  const [duration, setDuration] = useState(25);
  
  const handleDecreaseDuration = () => {
    if (duration > 5) {
      setDuration(duration - 5);
    }
  };
  
  const handleIncreaseDuration = () => {
    if (duration < 60) {
      setDuration(duration + 5);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Group Focus Session</DialogTitle>
          <DialogDescription>
            This will initiate a synchronized focus timer for all participants in the room.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h4 className="text-sm font-medium mb-3">Session Duration</h4>
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDecreaseDuration}
              disabled={duration <= 5}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 w-20 justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-medium">{duration}</span>
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleIncreaseDuration}
              disabled={duration >= 60}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">minutes</p>
        </div>
        
        <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
          <p className="font-medium">This will:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Start a synchronized timer for all group members</li>
            <li>Show a shared progress tracker</li>
            <li>Temporarily silence notifications</li>
            <li>Encourage everyone to stay focused</li>
          </ul>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onStartSession(duration)}>
            <Timer className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
