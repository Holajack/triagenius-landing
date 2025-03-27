
import { useTheme } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StudyEnvironment } from "@/types/onboarding";

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
  
  const updateValues = async () => {
    // Get environment values from various sources
    setLocalEnv(localStorage.getItem('environment'));
    setDomEnv(document.documentElement.getAttribute('data-environment'));
    
    // Get profile environment value
    if (user?.profile) {
      setProfileEnv(user.profile.last_selected_environment || null);
    }
    
    // Get environment from onboarding preferences
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('onboarding_preferences')
          .select('learning_environment')
          .eq('user_id', user.id)
          .single();
          
        if (!error && data) {
          setOnboardingPrefsEnv(data.learning_environment || null);
        }
      } catch (e) {
        console.error("Error fetching onboarding preferences:", e);
      }
    }
    
    // Also check localStorage
    const userPrefs = localStorage.getItem('userPreferences');
    if (userPrefs) {
      try {
        const parsedPrefs = JSON.parse(userPrefs);
        // Don't set onboardingPrefsEnv here to avoid overriding DB value
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
      onboardingPrefsEnv: onboardingPrefsEnv,
    });
  };
  
  // Update the values whenever any dependencies change
  useEffect(() => {
    updateValues();
  }, [environmentTheme, state.environment, user]);
  
  // Add a MutationObserver to detect DOM changes to data-environment attribute
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-environment') {
          updateValues();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Listen for storage events to update when environment changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'environment' || e.key === 'userPreferences') {
        updateValues();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const handleForceSync = async () => {
    try {
      setIsSyncing(true);
      
      // First, check if we're logged in
      if (!user || !user.id) {
        toast.error("Cannot sync environment - user not logged in");
        return;
      }
      
      // ALWAYS prioritize the DB value (source of truth)
      let environmentToSync = user.profile?.last_selected_environment;
      
      if (!environmentToSync) {
        // If no DB value, use the current visual state
        environmentToSync = environmentTheme || 
                          domEnv || 
                          localStorage.getItem('environment') || 
                          'office';
      }
      
      console.log(`[ENV DEBUG] Force syncing environment to: ${environmentToSync}`);
      
      // Begin transaction - update all sources at once
      
      // 1. Update profile table (source of truth)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          last_selected_environment: environmentToSync 
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
          learning_environment: environmentToSync 
        })
        .eq('user_id', user.id);
        
      if (prefError) {
        console.error("[ENV DEBUG] Error updating onboarding preferences:", prefError);
        toast.warning("Updated profile but failed to update onboarding preferences");
      } else {
        console.log("[ENV DEBUG] Successfully updated onboarding preferences");
      }
      
      // 3. Update localStorage
      localStorage.setItem('environment', environmentToSync);
      
      // 4. Update user preferences
      const userPrefs = localStorage.getItem('userPreferences');
      if (userPrefs) {
        try {
          const parsedPrefs = JSON.parse(userPrefs);
          parsedPrefs.environment = environmentToSync;
          localStorage.setItem('userPreferences', JSON.stringify(parsedPrefs));
        } catch (e) {
          console.error("Error updating userPreferences:", e);
        }
      }
      
      // 5. Force environment context update
      await forceEnvironmentSync();
      
      // 6. Apply to theme context
      setEnvironmentTheme(environmentToSync as StudyEnvironment);
      
      // 7. Apply CSS directly for immediate visual feedback
      document.documentElement.classList.remove(
        'theme-office', 
        'theme-park', 
        'theme-home', 
        'theme-coffee-shop', 
        'theme-library'
      );
      document.documentElement.classList.add(`theme-${environmentToSync}`);
      document.documentElement.setAttribute('data-environment', environmentToSync);
      
      // 8. Refresh user data
      await refreshUser();
      
      // 9. Update values in debug panel
      await updateValues();
      
      // 10. Verify the values were updated correctly
      setTimeout(async () => {
        // Double check that everything was updated
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('last_selected_environment')
          .eq('id', user.id)
          .single();
          
        const { data: prefCheck } = await supabase
          .from('onboarding_preferences')
          .select('learning_environment')
          .eq('user_id', user.id)
          .single();
          
        console.log("[ENV DEBUG] Verification check:", {
          profileValue: profileCheck?.last_selected_environment,
          prefValue: prefCheck?.learning_environment,
          expected: environmentToSync
        });
        
        if (profileCheck?.last_selected_environment !== environmentToSync || 
            prefCheck?.learning_environment !== environmentToSync) {
          console.error("[ENV DEBUG] Verification failed - values don't match");
          toast.error("Sync verification failed. Try again.");
        } else {
          toast.success("Environment synchronized successfully");
        }
      }, 1000);
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
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
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
