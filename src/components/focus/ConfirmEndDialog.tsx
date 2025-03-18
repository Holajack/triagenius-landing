
import React from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  
  // Get PWA status
  const isPwa = localStorage.getItem('isPWA') === 'true' || window.matchMedia('(display-mode: standalone)').matches;
  
  // Get additional mobile detection
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Direct action handler for mobile PWA
  const handleConfirm = (e: React.MouseEvent) => {
    // Prevent default behavior
    e.preventDefault();
    
    // For mobile PWA, navigate directly to Session Report
    if (isPwa && isMobile) {
      // Close dialog immediately first to prevent UI blocking
      onOpenChange(false);
      
      // Generate a session report ID
      const reportId = `session_${Date.now()}`;
      
      // Save session data - minimal approach for mobile
      try {
        // Get current session data if available
        const sessionData = localStorage.getItem('sessionData');
        if (sessionData) {
          // Store it as a report
          localStorage.setItem(`sessionReport_${reportId}`, sessionData);
        }
      } catch (e) {
        console.error('Error saving session data', e);
      }
      
      // Navigate directly to the session report page
      requestAnimationFrame(() => {
        navigate(`/session-report/${reportId}`, { replace: true });
      });
    } else {
      // Standard behavior for non-PWA
      onConfirm();
    }
  };

  // Optimized cancel handler
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    onCancel();
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
