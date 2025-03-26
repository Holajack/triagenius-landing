
import { useTheme } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useEffect, useState } from "react";

// Set to true to enable debugging
const SHOW_DEBUG = false;

const EnvironmentDebug = () => {
  const { environmentTheme } = useTheme();
  const { state } = useOnboarding();
  const [localEnv, setLocalEnv] = useState<string | null>(null);
  const [domEnv, setDomEnv] = useState<string | null>(null);
  
  useEffect(() => {
    setLocalEnv(localStorage.getItem('environment'));
    setDomEnv(document.documentElement.getAttribute('data-environment'));
  }, [environmentTheme, state.environment]);
  
  if (!SHOW_DEBUG) return null;
  
  return (
    <div className="fixed bottom-24 right-2 p-2 bg-black/80 text-white text-xs z-50 rounded max-w-[200px] opacity-70 hover:opacity-100">
      <h4 className="font-bold">Environment Debug</h4>
      <ul className="mt-1 space-y-1">
        <li>Context: <span className="font-mono">{environmentTheme || 'null'}</span></li>
        <li>Onboarding: <span className="font-mono">{state.environment || 'null'}</span></li>
        <li>LocalStorage: <span className="font-mono">{localEnv || 'null'}</span></li>
        <li>DOM attr: <span className="font-mono">{domEnv || 'null'}</span></li>
      </ul>
    </div>
  );
};

export default EnvironmentDebug;
