
import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Enable this for debugging environment issues
const DEBUG_ENV = true;

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
  environmentTheme: string | null;
  setEnvironmentTheme: (environment: string | null) => void;
  toggleTheme: () => void;
  applyEnvironmentTheme: (environment: string | null) => void;
  verifyEnvironmentWithDatabase: (userId: string) => Promise<boolean>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize theme from localStorage if available, otherwise default to 'light'
  const [theme, setThemeState] = useState<string>(() => {
    return localStorage.getItem('theme') || 'light';
  });
  
  // Initialize environment from localStorage if available
  const [environmentTheme, setEnvironmentThemeState] = useState<string | null>(() => {
    const envFromStorage = localStorage.getItem('environment');
    if (DEBUG_ENV) console.log('[ThemeContext] Initial env from localStorage:', envFromStorage);
    return envFromStorage || 'office';
  });

  // Check if we're on the landing page
  const isLandingPage = () => {
    return window.location.pathname === "/" || window.location.pathname === "/index";
  };

  // Update localStorage and apply theme when theme changes
  const setTheme = (newTheme: string) => {
    if (DEBUG_ENV) console.log('[ThemeContext] Setting theme:', newTheme);
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Set environment theme and update CSS classes
  const setEnvironmentTheme = (environment: string | null) => {
    if (DEBUG_ENV) console.log('[ThemeContext] Setting environment theme:', environment);
    
    if (environment) {
      setEnvironmentThemeState(environment);
      localStorage.setItem('environment', environment);
      
      // Apply CSS classes immediately - but only if not on landing page
      if (!isLandingPage()) {
        applyEnvironmentCSS(environment);
      }
      
      // Dispatch an event to notify other components about the environment change
      const event = new CustomEvent('environment-changed', { detail: { environment } });
      document.dispatchEvent(event);
    }
  };
  
  // Helper function to apply environment CSS
  const applyEnvironmentCSS = (environment: string) => {
    // Skip visual changes on landing page
    if (isLandingPage()) {
      if (DEBUG_ENV) console.log('[ThemeContext] Skipping visual CSS changes on landing page');
      return;
    }
    
    document.documentElement.classList.remove(
      'theme-office', 
      'theme-park', 
      'theme-home', 
      'theme-coffee-shop', 
      'theme-library'
    );
    document.documentElement.classList.add(`theme-${environment}`);
    document.documentElement.setAttribute('data-environment', environment);
  };

  // Apply environment theme
  const applyEnvironmentTheme = (environment: string | null) => {
    if (DEBUG_ENV) console.log('[ThemeContext] Applying environment theme:', environment);
    setEnvironmentTheme(environment);
  };

  // Apply theme to document
  const applyTheme = (selectedTheme: string) => {
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  // Enhanced function to verify environment consistency with database
  const verifyEnvironmentWithDatabase = async (userId: string): Promise<boolean> => {
    try {
      if (!userId) {
        console.log("[ThemeContext] Cannot verify without user ID");
        return false;
      }
      
      // Get environment from profile - our source of truth
      const { data, error } = await supabase
        .from('profiles')
        .select('last_selected_environment')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("[ThemeContext] Error verifying environment:", error);
        return false;
      }
      
      if (!data || !data.last_selected_environment) {
        console.log("[ThemeContext] No environment found in database");
        return false;
      }
      
      // Compare with current environment
      const dbEnvironment = data.last_selected_environment;
      const currentEnvironment = environmentTheme;
      const localStorageEnv = localStorage.getItem('environment');
      const domAttrEnv = document.documentElement.getAttribute('data-environment');
      
      if (DEBUG_ENV) {
        console.log("[ThemeContext] Environment verification:", {
          database: dbEnvironment,
          context: currentEnvironment,
          localStorage: localStorageEnv,
          domAttribute: domAttrEnv,
          isLandingPage: isLandingPage()
        });
      }
      
      // Check if all sources are consistent with database
      const isContextConsistent = dbEnvironment === currentEnvironment;
      const isLocalStorageConsistent = dbEnvironment === localStorageEnv;
      
      // Only check DOM if not on landing page
      const isDomConsistent = isLandingPage() ? true : dbEnvironment === domAttrEnv;
      
      const isFullyConsistent = isContextConsistent && isLocalStorageConsistent && isDomConsistent;
      
      if (!isFullyConsistent) {
        if (DEBUG_ENV) console.log("[ThemeContext] Environment inconsistencies detected");
        
        // If inconsistent with database, prioritize database value
        if (dbEnvironment) {
          if (DEBUG_ENV) console.log(`[ThemeContext] Syncing all environments to DB value: ${dbEnvironment}`);
          
          // Update context state
          setEnvironmentThemeState(dbEnvironment);
          
          // Update localStorage
          localStorage.setItem('environment', dbEnvironment);
          
          // Update DOM only if not on landing page
          if (!isLandingPage()) {
            applyEnvironmentCSS(dbEnvironment);
          }
          
          // Dispatch an event for other components
          const event = new CustomEvent('environment-changed', { detail: { environment: dbEnvironment } });
          document.dispatchEvent(event);
        }
      }
      
      return isFullyConsistent;
    } catch (error) {
      console.error("[ThemeContext] Error in verifyEnvironmentWithDatabase:", error);
      return false;
    }
  };

  // Apply theme on initial render and when changed
  useEffect(() => {
    applyTheme(theme);
    
    // Also make sure environment is applied on initial load
    if (environmentTheme) {
      if (DEBUG_ENV) console.log('[ThemeContext] useEffect applying environment:', environmentTheme);
      // Only apply CSS changes if not on landing page
      if (!isLandingPage()) {
        applyEnvironmentCSS(environmentTheme);
      }
    }
  }, [theme]);

  // Listen for localStorage changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'environment' && e.newValue) {
        if (DEBUG_ENV) console.log('[ThemeContext] Storage event: environment changed to', e.newValue);
        if (e.newValue !== environmentTheme) {
          setEnvironmentThemeState(e.newValue);
          // Only apply visual changes if not on landing page
          if (!isLandingPage()) {
            applyEnvironmentCSS(e.newValue);
          }
        }
      }
      
      if (e.key === 'theme' && e.newValue) {
        if (e.newValue !== theme) {
          setThemeState(e.newValue);
          applyTheme(e.newValue);
        }
      }
    };
    
    // Listen for custom environment change events
    const handleEnvironmentChange = (e: CustomEvent) => {
      const newEnvironment = e.detail?.environment;
      if (DEBUG_ENV) console.log('[ThemeContext] Custom event: environment changed to', newEnvironment);
      
      if (newEnvironment && newEnvironment !== environmentTheme) {
        setEnvironmentThemeState(newEnvironment);
        // Only apply visual changes if not on landing page
        if (!isLandingPage()) {
          applyEnvironmentCSS(newEnvironment);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('environment-changed', handleEnvironmentChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('environment-changed', handleEnvironmentChange as EventListener);
    };
  }, [environmentTheme, theme]);

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        setTheme, 
        environmentTheme, 
        setEnvironmentTheme,
        toggleTheme,
        applyEnvironmentTheme,
        verifyEnvironmentWithDatabase
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
