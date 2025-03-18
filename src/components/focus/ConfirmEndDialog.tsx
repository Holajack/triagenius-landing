
import React, { useRef, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, AlertCircle } from "lucide-react";

interface ConfirmEndDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmEnd: () => void; // Handler from parent
}

export function ConfirmEndDialog({
  open,
  onOpenChange,
  onConfirmEnd
}: ConfirmEndDialogProps) {
  const navigationAttemptedRef = useRef(false);
  
  // Reset navigation flag when dialog closes
  useEffect(() => {
    if (!open) {
      navigationAttemptedRef.current = false;
    }
  }, [open]);
  
  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Prevent multiple confirmation attempts
    if (navigationAttemptedRef.current) {
      return;
    }
    navigationAttemptedRef.current = true;
    
    // Close dialog immediately for better UX
    onOpenChange(false);
    
    // Use slight delay to ensure dialog closes before navigation
    setTimeout(() => {
      onConfirmEnd();
    }, 50);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="h-12 w-12 text-amber-500" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            End Session Early?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            <p className="mb-2">
              You still have time left on your focus session. Staying focused for the full duration
              will help you achieve better results!
            </p>
            <div className="flex items-center justify-center mt-4 mb-2">
              <Clock className="h-6 w-6 text-primary mr-2" />
              <span className="text-primary font-medium">
                Consistency builds better focus habits.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0">
          <AlertDialogCancel onClick={(e) => {
            e.preventDefault();
            onOpenChange(false);
          }} className="w-full sm:w-auto">
            Continue Focusing
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="w-full sm:w-auto">
            End Session Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
