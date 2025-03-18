
import React, { useRef, useEffect } from "react";
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
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConfirmEndDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmEndDialog({
  open,
  onOpenChange,
}: ConfirmEndDialogProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const navigationAttemptedRef = useRef(false);
  
  // Reset navigation flag when dialog closes
  useEffect(() => {
    if (!open) {
      navigationAttemptedRef.current = false;
    }
  }, [open]);
  
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Prevent multiple navigation attempts
    if (navigationAttemptedRef.current) {
      return;
    }
    navigationAttemptedRef.current = true;
    
    // Close dialog immediately for better UX
    onOpenChange(false);
    
    try {
      // Get current session data
      const sessionDataStr = localStorage.getItem('sessionData');
      
      if (sessionDataStr) {
        const sessionData = JSON.parse(sessionDataStr);
        
        // Generate a proper UUID for database compatibility
        let reportId = '';
        if (crypto.randomUUID) {
          reportId = crypto.randomUUID();
        } else {
          // Fallback to a timestamp-based ID if randomUUID isn't available
          reportId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        
        // Prepare report data
        const reportData = {
          ...sessionData,
          savedAt: new Date().toISOString(),
          deviceId: localStorage.getItem('deviceId') || 'unknown',
          completed: false
        };
        
        // Store in localStorage first before any async operations
        localStorage.setItem(`sessionReport_${reportId}`, JSON.stringify(reportData));
        localStorage.setItem(`sessionNotes_${reportId}`, "");
        localStorage.removeItem('sessionData');
        
        // Navigate to the report page immediately
        setTimeout(() => {
          try {
            navigate(`/session-report/${reportId}`, { replace: true });
          } catch (error) {
            console.error("Navigation error:", error);
            navigate("/dashboard", { replace: true });
          }
        }, 50);
        
        // Save to Supabase if online and user is logged in (after navigation to avoid blocking)
        if (navigator.onLine && user?.id) {
          try {
            // The database operation happens after navigation for better UX
            setTimeout(async () => {
              try {
                await supabase.from('focus_sessions').insert({
                  id: reportId,
                  user_id: user.id,
                  milestone_count: sessionData.milestone || 0,
                  duration: sessionData.duration || 0,
                  created_at: sessionData.timestamp || new Date().toISOString(),
                  environment: sessionData.environment || 'default',
                  completed: false
                });
              } catch (error) {
                console.error("Error saving session to database:", error);
              }
            }, 100);
          } catch (error) {
            console.error("Error scheduling database save:", error);
          }
        }
      } else {
        // No session data, redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 50);
      }
    } catch (error) {
      console.error("Error ending session:", error);
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 50);
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
