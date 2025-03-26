
import { createContext, useState, useContext, ReactNode, useEffect } from "react";

// Enable this for debugging environment issues
const DEBUG_ENV = false;

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
  environmentTheme: string | null;
  setEnvironmentTheme: (environment: string | null) => void;
  toggleTheme: () => void;
  applyEnvironmentTheme: (environment: string | null) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize theme from localStorage if available, otherwise default to 'light'
  const [theme, setThemeState] = useState<string>(() => {
    return localStorage.getItem('theme') || 'light';
  });
  
  // Initialize environment from localStorage if available
  const [environmentTheme, setEnvironmentThemeState] = useState<string | null>(() => {
    return localStorage.getItem('environment') || 'office';
  });

  // Update localStorage and apply theme when theme changes
  const setTheme = (newTheme: string) => {
    if (DEBUG_ENV) console.log('Setting theme:', newTheme);
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
    if (DEBUG_ENV) console.log('Setting environment theme:', environment);
    
    if (environment) {
      setEnvironmentThemeState(environment);
      localStorage.setItem('environment', environment);
      
      // Apply CSS classes immediately
      document.documentElement.classList.remove(
        'theme-office', 
        'theme-park', 
        'theme-home', 
        'theme-coffee-shop', 
        'theme-library'
      );
      document.documentElement.classList.add(`theme-${environment}`);
      document.documentElement.setAttribute('data-environment', environment);
    }
  };

  // Apply environment theme
  const applyEnvironmentTheme = (environment: string | null) => {
    if (DEBUG_ENV) console.log('Applying environment theme:', environment);
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

  // Apply theme on initial render
  useEffect(() => {
    applyTheme(theme);
    
    // Also make sure environment is applied on initial load
    if (environmentTheme) {
      document.documentElement.classList.remove(
        'theme-office', 
        'theme-park', 
        'theme-home', 
        'theme-coffee-shop', 
        'theme-library'
      );
      document.documentElement.classList.add(`theme-${environmentTheme}`);
      document.documentElement.setAttribute('data-environment', environmentTheme);
    }
  }, [theme, environmentTheme]);

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        setTheme, 
        environmentTheme, 
        setEnvironmentTheme,
        toggleTheme,
        applyEnvironmentTheme 
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
