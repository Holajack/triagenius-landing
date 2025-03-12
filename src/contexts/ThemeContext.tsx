
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useOnboarding } from './OnboardingContext';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const { state } = useOnboarding();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    }
  }, []);

  // Update localStorage and document class when theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    // Remove all theme classes
    document.documentElement.classList.remove('light', 'dark');
    
    // Add current theme class
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Apply environment theme classes
  useEffect(() => {
    if (state.environment) {
      // Remove any existing environment theme classes
      document.documentElement.classList.remove(
        'theme-office', 
        'theme-park', 
        'theme-home', 
        'theme-coffee-shop', 
        'theme-library'
      );
      
      // Add current environment theme class
      document.documentElement.classList.add(`theme-${state.environment}`);
    }
  }, [state.environment]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
