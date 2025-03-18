
import React, { useRef } from "react";
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
  
  // Enhanced PWA detection
  const isPwa = React.useMemo(() => {
    try {
      return (
        localStorage.getItem('isPWA') === 'true' || 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );
    } catch (e) {
      console.error("ConfirmEndDialog: PWA detection error:", e);
      return false;
    }
  }, []);
  
  // Enhanced mobile detection
  const isMobile = React.useMemo(() => {
    return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Prevent multiple navigation attempts
    if (navigationAttemptedRef.current) {
      console.log("ConfirmEndDialog: Navigation already attempted, ignoring");
      return;
    }
    navigationAttemptedRef.current = true;
    
    console.log("ConfirmEndDialog: handleConfirm called");
    console.log("ConfirmEndDialog: isPwa =", isPwa, "isMobile =", isMobile);
    
    // Close dialog immediately for better UX
    onOpenChange(false);
    
    // Generate a session report ID 
    const reportId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    console.log("ConfirmEndDialog: Generated reportId =", reportId);
    
    try {
      // Get current session data
      const sessionDataStr = localStorage.getItem('sessionData');
      if (sessionDataStr) {
        console.log("ConfirmEndDialog: Found sessionData in localStorage");
        const sessionData = JSON.parse(sessionDataStr);
        
        // Prepare report data
        const reportData = {
          ...sessionData,
          savedAt: new Date().toISOString(),
          deviceId: localStorage.getItem('deviceId') || 'unknown',
          offlineGenerated: !navigator.onLine,
          pwaMode: isPwa,
          completed: false // It was ended early
        };
        
        // Store in localStorage
        try {
          localStorage.setItem(`sessionReport_${reportId}`, JSON.stringify(reportData));
          localStorage.setItem(`sessionNotes_${reportId}`, "");
          
          // Add to sync queue if offline 
          if (!navigator.onLine && isPwa) {
            const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
            syncQueue.push({
              type: 'session_report',
              id: reportId,
              timestamp: Date.now()
            });
            localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
            console.log("ConfirmEndDialog: Added to offline sync queue");
          }
        } catch (storageError) {
          console.error('ConfirmEndDialog: Storage error:', storageError);
          toast.error("Storage limit reached. Some data may not be saved when offline.");
        }
        
        // Save to Supabase if online and user is logged in
        if (navigator.onLine && user?.id) {
          try {
            console.log("ConfirmEndDialog: Saving to Supabase for user", user.id);
            // Format ID as UUID for database compatibility
            const dbSessionId = reportId.replace(/[^a-zA-Z0-9-]/g, '');
            
            const { error } = await supabase.from('focus_sessions').insert({
              id: dbSessionId,
              user_id: user.id,
              milestone_count: sessionData.milestone || 0,
              duration: sessionData.duration || 0,
              created_at: sessionData.timestamp || new Date().toISOString(),
              environment: sessionData.environment || 'default',
              completed: false
            });
            
            if (error) {
              // Non-UUID format error handling
              if (error.code === '22P02') {
                console.log("ConfirmEndDialog: Using alternative ID format for database");
                const { error: retryError } = await supabase.from('focus_sessions').insert({
                  // Generate a proper UUID format
                  id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  user_id: user.id,
                  milestone_count: sessionData.milestone || 0,
                  duration: sessionData.duration || 0,
                  created_at: sessionData.timestamp || new Date().toISOString(),
                  environment: sessionData.environment || 'default',
                  completed: false,
                  metadata: { original_id: reportId } // Store original ID in metadata
                });
                
                if (retryError) throw retryError;
              } else {
                throw error;
              }
            }
            console.log("ConfirmEndDialog: Successfully saved to Supabase");
          } catch (e) {
            console.error('ConfirmEndDialog: Error saving session to database:', e);
            
            // For PWA, add to database sync queue
            if (isPwa) {
              try {
                const dbSyncQueue = JSON.parse(localStorage.getItem('dbSyncQueue') || '[]');
                dbSyncQueue.push({
                  operation: 'insert',
                  table: 'focus_sessions',
                  data: {
                    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    user_id: user.id,
                    milestone_count: sessionData.milestone || 0,
                    duration: sessionData.duration || 0,
                    created_at: sessionData.timestamp || new Date().toISOString(),
                    environment: sessionData.environment || 'default',
                    completed: false,
                    metadata: { original_id: reportId }
                  },
                  timestamp: Date.now()
                });
                localStorage.setItem('dbSyncQueue', JSON.stringify(dbSyncQueue));
                console.log("ConfirmEndDialog: Added database operation to sync queue");
              } catch (syncError) {
                console.error('ConfirmEndDialog: Error adding to sync queue:', syncError);
              }
            }
          }
        }
      }
      
      // Clear session data
      localStorage.removeItem('sessionData');
    } catch (e) {
      console.error('ConfirmEndDialog: Error saving session data', e);
    }
    
    // Select navigation strategy based on platform
    if (isPwa && isMobile) {
      // Mobile PWA approach with progressive enhancement
      navigateWithFallbacks(`/session-report/${reportId}`, true);
    } else {
      // Standard web approach
      navigateWithFallbacks(`/session-report/${reportId}`, false);
    }
  };
  
  // Helper function for navigation with fallbacks
  const navigateWithFallbacks = (destination: string, isMobilePwa: boolean) => {
    console.log(`ConfirmEndDialog: Navigating to ${destination}, isMobilePwa=${isMobilePwa}`);
    
    try {
      // Primary navigation with state
      navigate(destination, { 
        replace: true,
        state: { 
          fromFocusSession: true,
          timestamp: Date.now()
        }
      });
      
      // Set a fallback for mobile PWAs which sometimes have navigation issues
      if (isMobilePwa) {
        setTimeout(() => {
          // Check if we're still on the same page
          if (window.location.pathname.includes('focus-session')) {
            console.log("ConfirmEndDialog: Primary navigation failed, using fallback");
            window.location.href = destination;
          }
        }, 300);
      }
    } catch (navError) {
      console.error("ConfirmEndDialog: Navigation error", navError);
      // Last resort fallback
      window.location.href = destination;
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("ConfirmEndDialog: handleCancel called");
    onOpenChange(false);
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
