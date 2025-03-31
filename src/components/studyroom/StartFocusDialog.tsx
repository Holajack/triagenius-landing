
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Clock } from 'lucide-react';

export interface StartFocusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (duration: number) => void;
}

export const StartFocusDialog = ({
  open,
  onOpenChange,
  onConfirm
}: StartFocusDialogProps) => {
  const [duration, setDuration] = useState(25);

  const handleConfirm = () => {
    onConfirm(duration);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Start Focus Session
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-4">
              Set the duration of your focus session in minutes.
            </p>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Duration</span>
              <span className="font-medium">{duration} minutes</span>
            </div>
            <Slider
              value={[duration]}
              min={5}
              max={120}
              step={5}
              onValueChange={(values) => setDuration(values[0])}
              className="mb-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 min</span>
              <span>1 hour</span>
              <span>2 hours</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Start</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartFocusDialog;
