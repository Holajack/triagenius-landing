
import { useTheme } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Set to true to enable debugging
const SHOW_DEBUG = true;

const EnvironmentDebug = () => {
  const { environmentTheme, setEnvironmentTheme } = useTheme();
  const { state, forceEnvironmentSync } = useOnboarding();
  const { user, refreshUser } = useUser();
  const [localEnv, setLocalEnv] = useState<string | null>(null);
  const [domEnv, setDomEnv] = useState<string | null>(null);
  const [profileEnv, setProfileEnv] = useState<string | null>(null);
  const [onboardingPrefsEnv, setOnboardingPrefsEnv] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const updateValues = () => {
    // Get environment values from various sources
    setLocalEnv(localStorage.getItem('environment'));
    setDomEnv(document.documentElement.getAttribute('data-environment'));
    
    // Get profile environment value
    if (user?.profile) {
      setProfileEnv(user.profile.last_selected_environment || null);
    }
    
    // Get environment from onboarding preferences in localStorage
    const userPrefs = localStorage.getItem('userPreferences');
    if (userPrefs) {
      try {
        const parsedPrefs = JSON.parse(userPrefs);
        setOnboardingPrefsEnv(parsedPrefs.environment || null);
      } catch (e) {
        console.error("Error parsing userPreferences:", e);
      }
    }
    
    console.log("[ENV DEBUG] Current values:", {
      contextTheme: environmentTheme,
      onboardingState: state.environment,
      localStorage: localStorage.getItem('environment'),
      domAttribute: document.documentElement.getAttribute('data-environment'),
      profileEnv: user?.profile?.last_selected_environment,
    });
  };
  
  useEffect(() => {
    updateValues();
  }, [environmentTheme, state.environment, user]);
  
  const handleForceSync = async () => {
    try {
      setIsSyncing(true);
      
      // First, check if we're logged in
      if (!user || !user.id) {
        toast.error("Cannot sync environment - user not logged in");
        return;
      }
      
      // Get current environment from local state (visual)
      const currentVisualEnv = environmentTheme || 
                              domEnv || 
                              localStorage.getItem('environment') || 
                              'office';
      
      console.log(`[ENV DEBUG] Force syncing environment to: ${currentVisualEnv}`);
      
      // Update all relevant places
      
      // 1. Update profile table (source of truth)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          last_selected_environment: currentVisualEnv 
        })
        .eq('id', user.id);
        
      if (profileError) {
        console.error("[ENV DEBUG] Error updating profile:", profileError);
        toast.error("Failed to update profile environment");
        return;
      }
      
      // 2. Update onboarding preferences
      const { error: prefError } = await supabase
        .from('onboarding_preferences')
        .update({ 
          learning_environment: currentVisualEnv 
        })
        .eq('user_id', user.id);
        
      if (prefError) {
        console.error("[ENV DEBUG] Error updating onboarding preferences:", prefError);
      }
      
      // 3. Update localStorage
      localStorage.setItem('environment', currentVisualEnv);
      
      // 4. Update user preferences
      const userPrefs = localStorage.getItem('userPreferences');
      if (userPrefs) {
        try {
          const parsedPrefs = JSON.parse(userPrefs);
          parsedPrefs.environment = currentVisualEnv;
          localStorage.setItem('userPreferences', JSON.stringify(parsedPrefs));
        } catch (e) {
          console.error("Error updating userPreferences:", e);
        }
      }
      
      // 5. Force environment context update
      await forceEnvironmentSync();
      
      // 6. Apply to theme context
      setEnvironmentTheme(currentVisualEnv);
      
      // 7. Refresh user data
      await refreshUser();
      
      // 8. Update values in debug panel
      updateValues();
      
      toast.success("Environment synchronized successfully");
    } catch (error) {
      console.error("[ENV DEBUG] Error in sync:", error);
      toast.error("Failed to synchronize environment");
    } finally {
      setIsSyncing(false);
    }
  };
  
  if (!SHOW_DEBUG) return null;
  
  return (
    <div className="fixed bottom-24 right-2 p-2 bg-black/80 text-white text-xs z-50 rounded max-w-[250px] opacity-70 hover:opacity-100">
      <h4 className="font-bold">Environment Debug</h4>
      <ul className="mt-1 space-y-1">
        <li>ThemeContext: <span className="font-mono">{environmentTheme || 'null'}</span></li>
        <li>OnboardingContext: <span className="font-mono">{state.environment || 'null'}</span></li>
        <li>Profile DB: <span className="font-mono">{profileEnv || 'null'}</span></li>
        <li>Onboarding Prefs: <span className="font-mono">{onboardingPrefsEnv || 'null'}</span></li>
        <li>LocalStorage: <span className="font-mono">{localEnv || 'null'}</span></li>
        <li>DOM attr: <span className="font-mono">{domEnv || 'null'}</span></li>
      </ul>
      <div className="mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs h-7"
          onClick={handleForceSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <ReloadIcon className="h-3 w-3 mr-1 animate-spin" />
              Syncing...
            </>
          ) : (
            "Force Sync"
          )}
        </Button>
      </div>
    </div>
  );
};

export default EnvironmentDebug;
