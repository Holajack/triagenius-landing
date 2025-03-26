
import { useTheme } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";

// Set to true to enable debugging
const SHOW_DEBUG = true;

const EnvironmentDebug = () => {
  const { environmentTheme } = useTheme();
  const { state } = useOnboarding();
  const { user } = useUser();
  const [localEnv, setLocalEnv] = useState<string | null>(null);
  const [domEnv, setDomEnv] = useState<string | null>(null);
  const [profileEnv, setProfileEnv] = useState<string | null>(null);
  const [onboardingPrefsEnv, setOnboardingPrefsEnv] = useState<string | null>(null);
  
  useEffect(() => {
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
    
  }, [environmentTheme, state.environment, user]);
  
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
    </div>
  );
};

export default EnvironmentDebug;
