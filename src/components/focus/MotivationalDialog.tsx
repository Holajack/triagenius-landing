
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";

interface MotivationalDialogProps {
  open: boolean;
  onClose: () => void;
}

const motivationalMessages = [
  "You've made great progress! Want to push a little further?",
  "Remember why you started! Keep going strong!",
  "Every minute of focus brings you closer to your goals!",
  "You're building great habits! Keep the momentum going!",
  "Take a deep breath and let's continue this journey together!",
];

export const MotivationalDialog = ({ open, onClose }: MotivationalDialogProps) => {
  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Keep Going!
          </DialogTitle>
          <DialogDescription className="text-lg pt-2">
            {randomMessage}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={onClose}>
            Take a Break
          </Button>
          <Button onClick={onClose}>
            Continue Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
