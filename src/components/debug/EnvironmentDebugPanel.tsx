
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SyncStatus = {
  themeContext: string | null;
  onboardingContext: string | null;
  profileDb: string | null;
  onboardingPrefs: string | null;
  localStorage: string | null;
  domAttr: string | null;
  allInSync: boolean;
};

const EnvironmentDebugPanel = ({ userId }: { userId: string }) => {
  const [status, setStatus] = useState<SyncStatus>({
    themeContext: null,
    onboardingContext: null,
    profileDb: null,
    onboardingPrefs: null,
    localStorage: null,
    domAttr: null,
    allInSync: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { environmentTheme, verifyEnvironmentWithDatabase, shouldApplyEnvironmentTheming } = useTheme();
  const { state, forceEnvironmentSync } = useOnboarding();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const checkSyncStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorDetails(null);
      
      // Get values from localStorage and DOM
      const localStorageValue = localStorage.getItem('environment');
      const domAttrValue = document.documentElement.getAttribute('data-environment');
      
      // Get values from Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('last_selected_environment')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error("[DebugPanel] Error fetching profile:", profileError);
        setErrorDetails(`Profile fetch error: ${profileError.message}`);
      }
      const profileDbValue = profileError ? null : profileData?.last_selected_environment;
      
      const { data: prefData, error: prefError } = await supabase
        .from('onboarding_preferences')
        .select('learning_environment')
        .eq('user_id', userId)
        .single();
        
      if (prefError) {
        console.error("[DebugPanel] Error fetching onboarding prefs:", prefError);
        if (!errorDetails) {
          setErrorDetails(`Onboarding prefs fetch error: ${prefError.message}`);
        }
      }
      const onboardingPrefsValue = prefError ? null : prefData?.learning_environment;
      
      // Determine if all are in sync by comparing all values
      const allValues = [
        environmentTheme, 
        state.environment, 
        profileDbValue, 
        onboardingPrefsValue, 
        localStorageValue, 
        shouldApplyEnvironmentTheming() ? domAttrValue : localStorageValue // Only consider DOM if we're on a themed route
      ].filter(Boolean);
      
      // Check if all defined values are the same
      const uniqueValues = new Set(allValues);
      const allInSync = allValues.length > 0 && uniqueValues.size <= 1;
      
      setStatus({
        themeContext: environmentTheme,
        onboardingContext: state.environment,
        profileDb: profileDbValue,
        onboardingPrefs: onboardingPrefsValue,
        localStorage: localStorageValue,
        domAttr: shouldApplyEnvironmentTheming() ? domAttrValue : "(not applicable on this page)",
        allInSync
      });
      
      setLastSyncedAt(new Date());
      
    } catch (error) {
      console.error("[DebugPanel] Error checking environment sync:", error);
      setErrorDetails(`General error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [userId, environmentTheme, state.environment, shouldApplyEnvironmentTheming]);
  
  const handleForceSync = async () => {
    try {
      setIsSyncing(true);
      setErrorDetails(null);
      
      // Determine source of truth in this priority order
      const sourceOfTruth = status.profileDb || 
                          status.themeContext || 
                          status.localStorage || 
                          (shouldApplyEnvironmentTheming() ? status.domAttr : null) || 
                          'office'; // Default fallback
      
      console.log("[DebugPanel] Forcing sync with source of truth:", sourceOfTruth);
      
      // Update database in sequence with error checking
      let dbSuccess = true;
      
      // Update profile table first
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ last_selected_environment: sourceOfTruth })
        .eq('id', userId);
        
      if (profileError) {
        console.error("[DebugPanel] Error updating profile:", profileError);
        setErrorDetails(`Profile update error: ${profileError.message}`);
        dbSuccess = false;
      }
        
      // Then update onboarding preferences
      if (dbSuccess) {
        const { error: prefError } = await supabase
          .from('onboarding_preferences')
          .update({ learning_environment: sourceOfTruth })
          .eq('user_id', userId);
          
        if (prefError) {
          console.error("[DebugPanel] Error updating onboarding preferences:", prefError);
          if (!errorDetails) {
            setErrorDetails(`Onboarding prefs update error: ${prefError.message}`);
          }
          dbSuccess = false;
        }
      }
      
      if (!dbSuccess) {
        toast.error("Failed to update one or more database tables");
        setIsSyncing(false);
        return;
      }
      
      // Update OnboardingContext
      await forceEnvironmentSync();
      
      // Update ThemeContext and verify
      await verifyEnvironmentWithDatabase(userId);
      
      // Update localStorage and DOM directly for extra safety
      localStorage.setItem('environment', sourceOfTruth);
      
      if (shouldApplyEnvironmentTheming()) {
        document.documentElement.classList.remove(
          'theme-office', 
          'theme-park', 
          'theme-home', 
          'theme-coffee-shop', 
          'theme-library'
        );
        document.documentElement.classList.add(`theme-${sourceOfTruth}`);
        document.documentElement.setAttribute('data-environment', sourceOfTruth);
      }
      
      // Update localStorage cache of preferences
      const userPrefs = localStorage.getItem('userPreferences');
      if (userPrefs) {
        try {
          const parsedPrefs = JSON.parse(userPrefs);
          parsedPrefs.environment = sourceOfTruth;
          localStorage.setItem('userPreferences', JSON.stringify(parsedPrefs));
        } catch (e) {
          console.error("[DebugPanel] Error updating userPreferences:", e);
        }
      }
      
      // Broadcast the event
      const event = new CustomEvent('environment-changed', { 
        detail: { environment: sourceOfTruth } 
      });
      document.dispatchEvent(event);
      
      // Check status again
      await checkSyncStatus();
      
      toast.success("Environment forced in sync");
    } catch (error) {
      console.error("[DebugPanel] Error forcing environment sync:", error);
      setErrorDetails(`Sync error: ${error instanceof Error ? error.message : String(error)}`);
      toast.error("Failed to force environment sync");
    } finally {
      setIsSyncing(false);
    }
  };
  
  useEffect(() => {
    if (userId) {
      checkSyncStatus();
    }
  }, [userId, environmentTheme, state.environment, checkSyncStatus]);
  
  return (
    <Card className="p-4 text-xs">
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-semibold">Environment Debug</h3>
            {lastSyncedAt && (
              <p className="text-xs text-muted-foreground">
                Last checked: {lastSyncedAt.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkSyncStatus} 
              disabled={isLoading}
              className="h-7 text-xs px-2"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleForceSync} 
              disabled={isLoading || isSyncing || status.allInSync}
              className="h-7 text-xs px-2"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : 'Force Sync'}
            </Button>
          </div>
        </div>
        
        {status.allInSync ? (
          <div className="flex items-center text-green-600 bg-green-50 p-2 rounded">
            <CheckCircle className="h-3 w-3 mr-1" />
            All environments in sync: {status.themeContext || "unknown"}
          </div>
        ) : (
          <div className="bg-amber-50 p-2 rounded mb-2">
            <div className="flex items-center text-amber-600 mb-1">
              <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>Environment inconsistency detected</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
              <div>ThemeContext:</div><div className="font-mono">{status.themeContext || "null"}</div>
              <div>OnboardingContext:</div><div className="font-mono">{status.onboardingContext || "null"}</div>
              <div>Profile DB:</div><div className="font-mono">{status.profileDb || "null"}</div>
              <div>Onboarding Prefs:</div><div className="font-mono">{status.onboardingPrefs || "null"}</div>
              <div>LocalStorage:</div><div className="font-mono">{status.localStorage || "null"}</div>
              <div>DOM attr:</div><div className="font-mono">{status.domAttr || "null"}</div>
            </div>
          </div>
        )}
        
        {errorDetails && (
          <div className="mt-2 p-2 bg-red-50 text-red-600 rounded text-xs">
            <div className="font-semibold mb-1">Error details:</div>
            <div className="font-mono text-xs break-all">{errorDetails}</div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EnvironmentDebugPanel;
