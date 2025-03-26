
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
      
      // Apply CSS classes immediately - this function is called during login and profile load
      applyEnvironmentCSS(environment);
    }
  };
  
  // Helper function to apply environment CSS
  const applyEnvironmentCSS = (environment: string) => {
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
  
  // New function to verify environment consistency with database
  const verifyEnvironmentWithDatabase = async (userId: string): Promise<boolean> => {
    try {
      if (!userId) {
        console.log("[ThemeContext] Cannot verify without user ID");
        return false;
      }
      
      // Get environment from profile
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
      
      if (DEBUG_ENV) {
        console.log("[ThemeContext] Environment verification:", {
          database: dbEnvironment,
          context: currentEnvironment,
          localStorage: localStorage.getItem('environment'),
          domAttribute: document.documentElement.getAttribute('data-environment')
        });
      }
      
      const isConsistent = dbEnvironment === currentEnvironment;
      
      // If inconsistent, update database to match current visual state
      if (!isConsistent && currentEnvironment) {
        console.log(`[ThemeContext] Environment mismatch: DB=${dbEnvironment}, Current=${currentEnvironment}`);
        
        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            last_selected_environment: currentEnvironment 
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error("[ThemeContext] Error updating profile environment:", updateError);
        } else {
          console.log(`[ThemeContext] Database environment updated to match current: ${currentEnvironment}`);
        }
        
        // Also update onboarding preferences
        await supabase
          .from('onboarding_preferences')
          .update({ 
            learning_environment: currentEnvironment 
          })
          .eq('user_id', userId);
      }
      
      return isConsistent;
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
      applyEnvironmentCSS(environmentTheme);
    }
  }, [theme, environmentTheme]);

  // Listen for localStorage changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'environment' && e.newValue) {
        if (DEBUG_ENV) console.log('[ThemeContext] Storage event: environment changed to', e.newValue);
        if (e.newValue !== environmentTheme) {
          setEnvironmentThemeState(e.newValue);
        }
      }
      
      if (e.key === 'theme' && e.newValue) {
        if (e.newValue !== theme) {
          setThemeState(e.newValue);
          applyTheme(e.newValue);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
