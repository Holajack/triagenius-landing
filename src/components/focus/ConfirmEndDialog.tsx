
import React from "react";
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
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmEndDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: ConfirmEndDialogProps) {
  // Get PWA status
  const isPwa = localStorage.getItem('isPWA') === 'true';

  // Optimized confirm handler with PWA-specific paths
  const handleConfirm = (e: React.MouseEvent) => {
    // Prevent default behavior
    e.preventDefault();
    
    // For PWA, we need to be extra careful to avoid UI freezing
    if (isPwa) {
      // Close dialog immediately first to prevent UI blocking
      onOpenChange(false);
      
      // Very short timeout to ensure UI updates before heavy processing
      requestAnimationFrame(() => {
        // Call the confirm handler with minimal delay
        onConfirm();
      });
    } else {
      // Standard behavior for non-PWA
      onConfirm();
    }
  };

  // Optimized cancel handler with PWA-specific handling
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isPwa) {
      // Close dialog first for better mobile performance
      onOpenChange(false);
      requestAnimationFrame(() => {
        onCancel();
      });
    } else {
      // Standard behavior for browsers
      onCancel();
    }
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
          <AlertDialogCancel onClick={handleCancel} className="w-full sm:w-auto">
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
