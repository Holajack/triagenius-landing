
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
  const operationTimestampRef = useRef(0);
  
  // Add an effect to log when the dialog opens/closes for debugging
  useEffect(() => {
    console.log(`ConfirmEndDialog: Dialog ${open ? 'OPENED' : 'CLOSED'} at ${Date.now()}`);
    
    // Reset navigation attempted flag when dialog closes
    if (!open) {
      navigationAttemptedRef.current = false;
      console.log("ConfirmEndDialog: Reset navigationAttemptedRef on dialog close");
    }
    
    return () => {
      console.log(`ConfirmEndDialog: Dialog useEffect cleanup at ${Date.now()}`);
    };
  }, [open]);
  
  // Enhanced PWA detection
  const isPwa = React.useMemo(() => {
    try {
      const result = (
        localStorage.getItem('isPWA') === 'true' || 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );
      console.log("ConfirmEndDialog: isPwa detection =", result);
      return result;
    } catch (e) {
      console.error("ConfirmEndDialog: PWA detection error:", e);
      return false;
    }
  }, []);
  
  // Enhanced mobile detection
  const isMobile = React.useMemo(() => {
    const result = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log("ConfirmEndDialog: isMobile detection =", result);
    return result;
  }, []);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    operationTimestampRef.current = Date.now();
    
    // Log start of operation with timestamp
    console.log(`ConfirmEndDialog: handleConfirm STARTED at ${operationTimestampRef.current}`);
    
    // Prevent multiple navigation attempts
    if (navigationAttemptedRef.current) {
      console.log("ConfirmEndDialog: Navigation already attempted, ignoring");
      return;
    }
    
    // Log and set navigation flag
    console.log("ConfirmEndDialog: Setting navigationAttemptedRef = true");
    navigationAttemptedRef.current = true;
    
    console.log("ConfirmEndDialog: isPwa =", isPwa, "isMobile =", isMobile);
    
    // IMPORTANT: Close dialog immediately for better UX
    console.log("ConfirmEndDialog: Closing dialog immediately");
    onOpenChange(false);
    
    // Ensure UI has time to update by deferring next operations
    setTimeout(() => {
      console.log(`ConfirmEndDialog: After dialog close timeout triggered at ${Date.now()}, elapsed: ${Date.now() - operationTimestampRef.current}ms`);
      
      // Generate a session report ID 
      const reportId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      console.log("ConfirmEndDialog: Generated reportId =", reportId);
      
      try {
        // Get current session data
        const sessionDataStr = localStorage.getItem('sessionData');
        console.log("ConfirmEndDialog: Retrieved sessionData from localStorage:", sessionDataStr ? "data found" : "no data");
        
        if (sessionDataStr) {
          console.log(`ConfirmEndDialog: Processing sessionData at ${Date.now()}, elapsed: ${Date.now() - operationTimestampRef.current}ms`);
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
            console.log(`ConfirmEndDialog: Saving to localStorage at ${Date.now()}, elapsed: ${Date.now() - operationTimestampRef.current}ms`);
            localStorage.setItem(`sessionReport_${reportId}`, JSON.stringify(reportData));
            localStorage.setItem(`sessionNotes_${reportId}`, "");
            
            // Add to sync queue if offline 
            if (!navigator.onLine && isPwa) {
              console.log("ConfirmEndDialog: Adding to offline sync queue");
              const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
              syncQueue.push({
                type: 'session_report',
                id: reportId,
                timestamp: Date.now()
              });
              localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
            }
          } catch (storageError) {
            console.error('ConfirmEndDialog: Storage error:', storageError);
            toast.error("Storage limit reached. Some data may not be saved when offline.");
          }
          
          // Save to Supabase if online and user is logged in
          if (navigator.onLine && user?.id) {
            // Use setTimeout to avoid blocking UI
            setTimeout(async () => {
              try {
                console.log(`ConfirmEndDialog: Supabase save started at ${Date.now()}, elapsed: ${Date.now() - operationTimestampRef.current}ms`);
                
                // Format ID as UUID for database compatibility
                const dbSessionId = reportId.replace(/[^a-zA-Z0-9-]/g, '');
                
                console.log("ConfirmEndDialog: Attempt to save to Supabase with ID:", dbSessionId);
                
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
                  console.error("ConfirmEndDialog: Supabase insert error:", error);
                  
                  // Non-UUID format error handling
                  if (error.code === '22P02') {
                    console.log("ConfirmEndDialog: Using alternative ID format for database");
                    
                    // Prepare data without the metadata field that was causing issues
                    const retryData = {
                      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      user_id: user.id,
                      milestone_count: sessionData.milestone || 0,
                      duration: sessionData.duration || 0,
                      created_at: sessionData.timestamp || new Date().toISOString(),
                      environment: sessionData.environment || 'default',
                      completed: false
                    };
                    
                    console.log("ConfirmEndDialog: Retry insert with data:", retryData);
                    
                    const { error: retryError } = await supabase.from('focus_sessions').insert(retryData);
                    
                    if (retryError) {
                      console.error("ConfirmEndDialog: Retry insert failed:", retryError);
                      throw retryError;
                    } else {
                      console.log("ConfirmEndDialog: Retry insert succeeded");
                    }
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
                    console.log("ConfirmEndDialog: Adding failed operation to dbSyncQueue");
                    const dbSyncQueue = JSON.parse(localStorage.getItem('dbSyncQueue') || '[]');
                    
                    // Create sync entry without metadata field
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
                        completed: false
                      },
                      timestamp: Date.now()
                    });
                    localStorage.setItem('dbSyncQueue', JSON.stringify(dbSyncQueue));
                  } catch (syncError) {
                    console.error('ConfirmEndDialog: Error adding to sync queue:', syncError);
                  }
                }
              }
            }, 0);
          }
        }
        
        // Clear session data
        console.log("ConfirmEndDialog: Clearing sessionData from localStorage");
        localStorage.removeItem('sessionData');
      } catch (e) {
        console.error('ConfirmEndDialog: Error saving session data', e);
      }
      
      // IMPORTANT: Add small delay before navigation to ensure UI updates
      console.log(`ConfirmEndDialog: Preparing navigation at ${Date.now()}, elapsed: ${Date.now() - operationTimestampRef.current}ms`);
      
      // Select navigation strategy based on platform
      if (isPwa && isMobile) {
        // Mobile PWA approach with progressive enhancement
        console.log("ConfirmEndDialog: Using Mobile PWA navigation approach");
        navigateWithFallbacks(`/session-report/${reportId}`, true);
      } else {
        // Standard web approach
        console.log("ConfirmEndDialog: Using standard navigation approach");
        navigateWithFallbacks(`/session-report/${reportId}`, false);
      }
    }, 50); // Small delay to allow dialog to close first
  };
  
  // Helper function for navigation with fallbacks
  const navigateWithFallbacks = (destination: string, isMobilePwa: boolean) => {
    console.log(`ConfirmEndDialog: navigateWithFallbacks to ${destination}, isMobilePwa=${isMobilePwa} at ${Date.now()}, elapsed: ${Date.now() - operationTimestampRef.current}ms`);
    
    try {
      // Primary navigation with state
      console.log("ConfirmEndDialog: Attempting primary navigation using react-router navigate()");
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
          console.log(`ConfirmEndDialog: Checking if fallback navigation needed at ${Date.now()}, elapsed: ${Date.now() - operationTimestampRef.current}ms`);
          // Check if we're still on the same page
          if (window.location.pathname.includes('focus-session')) {
            console.log("ConfirmEndDialog: Primary navigation failed, using fallback window.location.href");
            window.location.href = destination;
          } else {
            console.log("ConfirmEndDialog: Primary navigation succeeded, no fallback needed");
          }
        }, 300);
      }
    } catch (navError) {
      console.error("ConfirmEndDialog: Navigation error", navError);
      // Last resort fallback
      console.log("ConfirmEndDialog: Using last resort fallback with window.location.href");
      window.location.href = destination;
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("ConfirmEndDialog: handleCancel called at", Date.now());
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={(newOpenState) => {
      console.log(`ConfirmEndDialog: AlertDialog onOpenChange called with ${newOpenState} at ${Date.now()}`);
      onOpenChange(newOpenState);
    }}>
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
