
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setEnvironmentTheme: (environment: string | undefined) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to light theme if no preference is saved
      setTheme('light');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  // Update localStorage and document class when theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    // Remove all theme classes first
    document.documentElement.classList.remove('light', 'dark');
    
    // Add current theme class
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Set environment theme classes
  const setEnvironmentTheme = (environment: string | undefined) => {
    if (environment) {
      // Remove any existing environment theme classes
      document.documentElement.classList.remove(
        'theme-office', 
        'theme-park', 
        'theme-home', 
        'theme-coffee-shop', 
        'theme-library'
      );
      
      // Add current environment theme class
      document.documentElement.classList.add(`theme-${environment}`);
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, setEnvironmentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
