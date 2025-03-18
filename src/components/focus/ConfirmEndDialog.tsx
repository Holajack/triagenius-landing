
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
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const { user } = useUser();
  const navigationAttemptedRef = React.useRef(false);
  
  // Enhanced PWA detection covering more scenarios
  const isPwa = React.useMemo(() => {
    try {
      // More comprehensive PWA detection
      return localStorage.getItem('isPWA') === 'true' || 
             window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone === true;
    } catch (e) {
      console.error("ConfirmEndDialog: PWA detection error:", e);
      return false;
    }
  }, []);
  
  // Enhanced mobile detection including tablets
  const isMobile = React.useMemo(() => {
    return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Direct action handler with improved offline support
  const handleConfirm = async (e: React.MouseEvent) => {
    // Prevent default behavior
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
    
    // Generate a session report ID with timestamp and random component for uniqueness
    // Format: session_timestamp_random - this helps with indexedDB storage and offline sync
    const reportId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    console.log("ConfirmEndDialog: Generated reportId =", reportId);
    
    // Save session data - enhanced for offline usage
    try {
      // Get current session data if available
      const sessionDataStr = localStorage.getItem('sessionData');
      if (sessionDataStr) {
        console.log("ConfirmEndDialog: Found sessionData in localStorage");
        const sessionData = JSON.parse(sessionDataStr);
        
        // Prepare report data with metadata for better offline handling
        const reportData = {
          ...sessionData,
          savedAt: new Date().toISOString(),
          deviceId: localStorage.getItem('deviceId') || 'unknown', // Track device for better offline sync
          offlineGenerated: !navigator.onLine, // Flag if generated while offline
          pwaMode: isPwa,
          completed: false // It was ended early
        };
        
        // Store in localStorage with robust error handling
        try {
          localStorage.setItem(`sessionReport_${reportId}`, JSON.stringify(reportData));
          
          // Add to sync queue if offline for later synchronization
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
          // Fall back to session storage if localStorage is full
          sessionStorage.setItem(`sessionReport_${reportId}`, JSON.stringify(reportData));
          toast.error("Storage limit reached. Some data may not be saved when offline.");
        }
        
        // Save notes separately (empty for now)
        try {
          localStorage.setItem(`sessionNotes_${reportId}`, "");
        } catch (e) {
          console.error('ConfirmEndDialog: Error saving notes:', e);
        }
        
        // Try to save to Supabase if online and user is logged in
        if (navigator.onLine && user?.id) {
          try {
            console.log("ConfirmEndDialog: Saving to Supabase for user", user.id);
            const { error } = await supabase.from('focus_sessions').insert({
              id: reportId,
              user_id: user.id,
              milestone_count: sessionData.milestone || 0,
              duration: sessionData.duration || 0,
              created_at: sessionData.timestamp || new Date().toISOString(),
              environment: sessionData.environment || 'default',
              completed: false // Since session ended early
            });
            
            if (error) {
              throw error;
            }
            console.log("ConfirmEndDialog: Successfully saved to Supabase");
          } catch (e) {
            console.error('ConfirmEndDialog: Error saving session to database:', e);
            
            // For PWA, add to database sync queue to retry later when online
            if (isPwa) {
              try {
                const dbSyncQueue = JSON.parse(localStorage.getItem('dbSyncQueue') || '[]');
                dbSyncQueue.push({
                  operation: 'insert',
                  table: 'focus_sessions',
                  data: {
                    id: reportId,
                    user_id: user.id,
                    milestone_count: sessionData.milestone || 0,
                    duration: sessionData.duration || 0,
                    created_at: sessionData.timestamp || new Date().toISOString(),
                    environment: sessionData.environment || 'default',
                    completed: false
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
      
      // Clear session data since we're ending
      localStorage.removeItem('sessionData');
    } catch (e) {
      console.error('ConfirmEndDialog: Error saving session data', e);
    }
    
    // Use a reliable navigation approach based on platform
    console.log("ConfirmEndDialog: About to navigate to session report");
    
    // For mobile PWA, use immediate navigation with fallbacks
    if (isPwa && isMobile) {
      console.log("ConfirmEndDialog: Using optimized mobile PWA navigation");
      
      try {
        // Primary navigation - direct with state
        navigate(`/session-report/${reportId}`, { 
          replace: true,
          state: { 
            fromPwa: true,
            offlineMode: !navigator.onLine,
            timestamp: Date.now()
          }
        });
        
        // Backup navigation in case primary fails (happens on some devices)
        setTimeout(() => {
          // Only trigger if we're still on the same page
          if (window.location.pathname.includes('focus-session')) {
            console.log("ConfirmEndDialog: Backup navigation triggered");
            window.location.href = `/session-report/${reportId}`;
          }
        }, 300);
      } catch (navError) {
        console.error("ConfirmEndDialog: Navigation error", navError);
        // Last resort fallback
        window.location.href = `/session-report/${reportId}`;
      }
    } else {
      // Standard navigation for web app
      console.log("ConfirmEndDialog: Using standard navigation");
      
      try {
        // Use navigate with replace to prevent back navigation to session
        navigate(`/session-report/${reportId}`, { replace: true });
        
        // Fallback if react-router navigation fails
        setTimeout(() => {
          if (window.location.pathname.includes('focus-session')) {
            console.log("ConfirmEndDialog: Fallback navigation triggered");
            window.location.href = `/session-report/${reportId}`;
          }
        }, 200);
      } catch (e) {
        console.error("ConfirmEndDialog: Navigation error", e);
        // Direct location change as last resort
        window.location.href = `/session-report/${reportId}`;
      }
    }
    
    // Call onConfirm after navigation for any parent component cleanup
    setTimeout(() => {
      onConfirm();
    }, 100);
  };

  // Optimized cancel handler
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("ConfirmEndDialog: handleCancel called");
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
