
import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

// Enable this for debugging environment issues
const DEBUG_ENV = true;

// Define which routes should have environment theming applied
const THEMED_ROUTES = [
  '/dashboard',
  '/community',
  '/bonuses',
  '/results',
  '/profile',
  '/leaderboard',
  '/settings',
  '/nora',
  '/reports' // Adding reports since it's in the NavigationBar
];

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
  environmentTheme: string | null;
  setEnvironmentTheme: (environment: string | null) => void;
  toggleTheme: () => void;
  applyEnvironmentTheme: (environment: string | null) => void;
  verifyEnvironmentWithDatabase: (userId: string) => Promise<boolean>;
  shouldApplyEnvironmentTheming: () => boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  
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

  // Check if the current route should have environment theming
  const shouldApplyEnvironmentTheming = useCallback(() => {
    const currentPath = location.pathname;
    return THEMED_ROUTES.some(route => currentPath.startsWith(route));
  }, [location.pathname]);

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

  // Helper function to apply environment CSS
  const applyEnvironmentCSS = useCallback((environment: string) => {
    // Skip visual changes on non-themed routes
    if (!shouldApplyEnvironmentTheming()) {
      if (DEBUG_ENV) console.log('[ThemeContext] Skipping visual CSS changes on non-themed route');
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
  }, [shouldApplyEnvironmentTheming]);

  // Set environment theme and update CSS classes
  const setEnvironmentTheme = useCallback((environment: string | null) => {
    if (DEBUG_ENV) console.log('[ThemeContext] Setting environment theme:', environment);
    
    if (environment) {
      setEnvironmentThemeState(environment);
      localStorage.setItem('environment', environment);
      
      // Apply CSS classes only if on a themed route
      if (shouldApplyEnvironmentTheming()) {
        applyEnvironmentCSS(environment);
      }
      
      // Dispatch an event to notify other components about the environment change
      const event = new CustomEvent('environment-changed', { detail: { environment } });
      document.dispatchEvent(event);
    }
  }, [shouldApplyEnvironmentTheming, applyEnvironmentCSS]);

  // Apply environment theme
  const applyEnvironmentTheme = useCallback((environment: string | null) => {
    if (DEBUG_ENV) console.log('[ThemeContext] Applying environment theme:', environment);
    setEnvironmentTheme(environment);
  }, [setEnvironmentTheme]);

  // Apply theme to document
  const applyTheme = (selectedTheme: string) => {
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  // Enhanced function to verify environment consistency with database
  const verifyEnvironmentWithDatabase = useCallback(async (userId: string): Promise<boolean> => {
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
      
      // Only check DOM attribute if on themed route
      const isThemedRoute = shouldApplyEnvironmentTheming();
      const domAttrEnv = isThemedRoute 
        ? document.documentElement.getAttribute('data-environment') 
        : null;
      
      if (DEBUG_ENV) {
        console.log("[ThemeContext] Environment verification:", {
          database: dbEnvironment,
          context: currentEnvironment,
          localStorage: localStorageEnv,
          domAttribute: domAttrEnv,
          shouldApplyTheming: isThemedRoute,
          route: location.pathname
        });
      }
      
      // Check if all sources are consistent with database
      const isContextConsistent = dbEnvironment === currentEnvironment;
      const isLocalStorageConsistent = dbEnvironment === localStorageEnv;
      
      // Only check DOM if on themed route
      const isDomConsistent = !isThemedRoute ? true : dbEnvironment === domAttrEnv;
      
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
          
          // Update DOM only if on themed route
          if (isThemedRoute) {
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
  }, [environmentTheme, shouldApplyEnvironmentTheming, location.pathname, applyEnvironmentCSS]);

  // Apply theme on initial render and when changed
  useEffect(() => {
    applyTheme(theme);
    
    // Also make sure environment is applied on initial load
    if (environmentTheme) {
      if (DEBUG_ENV) console.log('[ThemeContext] useEffect applying environment:', environmentTheme);
      // Only apply CSS changes if on themed route
      if (shouldApplyEnvironmentTheming()) {
        applyEnvironmentCSS(environmentTheme);
      }
    }
  }, [theme, environmentTheme, shouldApplyEnvironmentTheming, applyEnvironmentCSS]);

  // Apply environment changes when route changes
  useEffect(() => {
    if (environmentTheme && shouldApplyEnvironmentTheming()) {
      if (DEBUG_ENV) console.log('[ThemeContext] Route changed, applying environment:', environmentTheme);
      applyEnvironmentCSS(environmentTheme);
    } else if (!shouldApplyEnvironmentTheming()) {
      // Remove environment classes when navigating away from themed routes
      if (DEBUG_ENV) console.log('[ThemeContext] Route changed to non-themed route, removing environment classes');
      document.documentElement.classList.remove(
        'theme-office', 
        'theme-park', 
        'theme-home', 
        'theme-coffee-shop', 
        'theme-library'
      );
      document.documentElement.removeAttribute('data-environment');
    }
  }, [location.pathname, environmentTheme, shouldApplyEnvironmentTheming, applyEnvironmentCSS]);

  // Listen for localStorage changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'environment' && e.newValue) {
        if (DEBUG_ENV) console.log('[ThemeContext] Storage event: environment changed to', e.newValue);
        if (e.newValue !== environmentTheme) {
          setEnvironmentThemeState(e.newValue);
          // Only apply visual changes if on themed route
          if (shouldApplyEnvironmentTheming()) {
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
        // Only apply visual changes if on themed route
        if (shouldApplyEnvironmentTheming()) {
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
  }, [environmentTheme, theme, shouldApplyEnvironmentTheming, applyEnvironmentCSS]);

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        setTheme, 
        environmentTheme, 
        setEnvironmentTheme,
        toggleTheme,
        applyEnvironmentTheme,
        verifyEnvironmentWithDatabase,
        shouldApplyEnvironmentTheming
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
