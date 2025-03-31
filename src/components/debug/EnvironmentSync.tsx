
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "@/hooks/use-user";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { getEnvironmentStatus, applyEnvironmentLocally } from "@/services/environmentServices";

// Automatic environment synchronization component that works silently
const EnvironmentSync = () => {
  const { user } = useUser();
  const { environmentTheme, shouldApplyEnvironmentTheming } = useTheme();
  const { state, forceEnvironmentSync } = useOnboarding();
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Check for and resolve environment inconsistencies
  useEffect(() => {
    const checkAndFixEnvironment = async () => {
      if (!user?.id || isSyncing) return;
      
      // Don't check too frequently
      const now = Date.now();
      if (now - lastCheckTime < 10000) return; // Only check every 10 seconds max
      
      try {
        setIsSyncing(true);
        setLastCheckTime(now);
        
        // Get status from all sources
        const status = await getEnvironmentStatus(user.id);
        
        // If everything is in sync, do nothing
        if (status.allMatch) return;
        
        // If database value exists but doesn't match other sources, sync from database
        if (status.profileDb) {
          // Only fix if the contexts or localStorage are out of sync with DB
          if (
            status.profileDb !== environmentTheme || 
            status.profileDb !== state.environment ||
            status.profileDb !== status.localStorage
          ) {
            console.log(`[EnvironmentSync] Auto-fixing environment to match database: ${status.profileDb}`);
            
            // Update localStorage and DOM
            applyEnvironmentLocally(status.profileDb, shouldApplyEnvironmentTheming());
            
            // Update contexts
            await forceEnvironmentSync();
            
            // No toast to avoid disrupting the user
          }
        }
      } catch (error) {
        console.error("[EnvironmentSync] Error checking environment:", error);
      } finally {
        setIsSyncing(false);
      }
    };
    
    // Check on mount and whenever key values change
    checkAndFixEnvironment();
    
    // Also set up periodic checks
    const interval = setInterval(checkAndFixEnvironment, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [user?.id, environmentTheme, state.environment, lastCheckTime, isSyncing, shouldApplyEnvironmentTheming, forceEnvironmentSync]);
  
  // Listen for specific sync failures needing intervention
  useEffect(() => {
    const handleSyncFailure = (e: CustomEvent) => {
      if (e.detail?.silent) return; // Skip silent failure events
      
      toast.error("Environment sync issue detected", {
        description: "Refreshing the page may help resolve this issue.",
        action: {
          label: "Refresh",
          onClick: () => window.location.reload()
        }
      });
    };
    
    document.addEventListener('environment-sync-failure', handleSyncFailure as EventListener);
    
    return () => {
      document.removeEventListener('environment-sync-failure', handleSyncFailure as EventListener);
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default EnvironmentSync;
