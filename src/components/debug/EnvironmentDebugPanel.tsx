
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
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
  const { environmentTheme, verifyEnvironmentWithDatabase } = useTheme();
  const { state, forceEnvironmentSync } = useOnboarding();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const checkSyncStatus = async () => {
    try {
      setIsLoading(true);
      
      // Get values from localStorage and DOM
      const localStorageValue = localStorage.getItem('environment');
      const domAttrValue = document.documentElement.getAttribute('data-environment');
      
      // Get values from Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('last_selected_environment')
        .eq('id', userId)
        .single();
        
      const profileDbValue = profileError ? null : profileData?.last_selected_environment;
      
      const { data: prefData, error: prefError } = await supabase
        .from('onboarding_preferences')
        .select('learning_environment')
        .eq('user_id', userId)
        .single();
        
      const onboardingPrefsValue = prefError ? null : prefData?.learning_environment;
      
      // Determine if all are in sync by comparing all values
      const allValues = [
        environmentTheme, 
        state.environment, 
        profileDbValue, 
        onboardingPrefsValue, 
        localStorageValue, 
        domAttrValue
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
        domAttr: domAttrValue,
        allInSync
      });
      
      setLastSyncedAt(new Date());
      
    } catch (error) {
      console.error("Error checking environment sync:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForceSync = async () => {
    try {
      setIsSyncing(true);
      
      // Determine which value to use as source of truth
      // Priority: 1. Profile DB, 2. Theme Context, 3. localStorage, 4. DOM attr
      const sourceOfTruth = status.profileDb || 
                          status.themeContext || 
                          status.localStorage || 
                          status.domAttr || 
                          'office'; // Default fallback
      
      console.log("[EnvironmentDebugPanel] Forcing sync with source of truth:", sourceOfTruth);
      
      // Update database first - critical source of truth
      if (sourceOfTruth) {
        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ last_selected_environment: sourceOfTruth })
          .eq('id', userId);
          
        if (profileError) {
          console.error("[EnvironmentDebugPanel] Error updating profile:", profileError);
          toast.error("Failed to update profile database");
          return;
        }
          
        // Update onboarding preferences
        const { error: prefError } = await supabase
          .from('onboarding_preferences')
          .update({ learning_environment: sourceOfTruth })
          .eq('user_id', userId);
          
        if (prefError) {
          console.error("[EnvironmentDebugPanel] Error updating preferences:", prefError);
          toast.error("Failed to update onboarding preferences");
          return;
        }
      }
      
      // Force sync in OnboardingContext and ThemeContext
      await forceEnvironmentSync();
      await verifyEnvironmentWithDatabase(userId);
      
      // Update DOM and localStorage directly to be extra safe
      if (sourceOfTruth) {
        // Check if we're on the landing page
        const isLandingPage = window.location.pathname === "/" || window.location.pathname === "/index";
        
        // Don't apply visual changes on landing page
        if (!isLandingPage) {
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
        
        // Always update localStorage
        localStorage.setItem('environment', sourceOfTruth);
        
        // Update preferences in localStorage too
        const userPrefs = localStorage.getItem('userPreferences');
        if (userPrefs) {
          try {
            const parsedPrefs = JSON.parse(userPrefs);
            parsedPrefs.environment = sourceOfTruth;
            localStorage.setItem('userPreferences', JSON.stringify(parsedPrefs));
          } catch (e) {
            console.error("Error updating userPreferences:", e);
          }
        }
      }
      
      // Dispatch an event for any other components listening
      const event = new CustomEvent('environment-changed', { 
        detail: { environment: sourceOfTruth } 
      });
      document.dispatchEvent(event);
      
      // Check status again
      await checkSyncStatus();
      
      toast.success("Environment forced in sync");
    } catch (error) {
      console.error("Error forcing environment sync:", error);
      toast.error("Failed to force environment sync");
    } finally {
      setIsSyncing(false);
    }
  };
  
  useEffect(() => {
    if (userId) {
      checkSyncStatus();
    }
  }, [userId, environmentTheme, state.environment]);
  
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
              {isSyncing ? 'Syncing...' : 'Force Sync'}
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
      </div>
    </Card>
  );
};

export default EnvironmentDebugPanel;
