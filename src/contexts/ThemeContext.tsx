
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/use-user';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setEnvironmentTheme: (environment: string | undefined) => void;
  currentEnvironment: string | undefined;
  applyEnvironmentTheme: (environment: string | undefined) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [currentEnvironment, setCurrentEnvironment] = useState<string | undefined>(undefined);
  const { user } = useUser();

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

    // Load saved environment
    const savedEnvironment = localStorage.getItem('environment');
    if (savedEnvironment) {
      setCurrentEnvironment(savedEnvironment);
      applyEnvironmentTheme(savedEnvironment);
    }
  }, []);

  // Load user preferences when user is authenticated
  useEffect(() => {
    if (!user) return; // Don't try to load if user is null or undefined
    
    const loadUserPreferences = async () => {
      if (!user.id) return; // Additional safety check
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        if (!error && data?.preferences) {
          // Type assertion to help TypeScript understand the structure
          const preferences = data.preferences as { 
            environment?: string; 
            theme?: string;
          };
          
          // Apply saved environment if available
          if (preferences.environment) {
            setCurrentEnvironment(preferences.environment);
            applyEnvironmentTheme(preferences.environment);
            localStorage.setItem('environment', preferences.environment);
          }
          
          // Apply saved theme if available
          if (preferences.theme) {
            setTheme(preferences.theme as ThemeMode);
            localStorage.setItem('theme', preferences.theme);
          }
        }
      } catch (err) {
        console.error('Failed to load user preferences:', err);
      }
    };

    loadUserPreferences();
  }, [user]);

  // Update localStorage and document class when theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    // Remove all theme classes first
    document.documentElement.classList.remove('light', 'dark');
    
    // Add current theme class
    document.documentElement.classList.add(theme);

    // Save to user preferences if authenticated
    if (user?.id) {
      saveUserPreferences();
    }
  }, [theme, user?.id]);

  // Save user preferences to database
  const saveUserPreferences = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: {
            theme,
            environment: currentEnvironment
          }
        })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to save user preferences:', error);
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
    }
  };

  // Apply environment theme classes
  const applyEnvironmentTheme = (environment: string | undefined) => {
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
      
      // Add a data attribute for easier CSS targeting
      document.documentElement.setAttribute('data-environment', environment);
    } else {
      document.documentElement.removeAttribute('data-environment');
    }
  };

  // Set environment theme classes
  const setEnvironmentTheme = (environment: string | undefined) => {
    setCurrentEnvironment(environment);
    applyEnvironmentTheme(environment);
    localStorage.setItem('environment', environment || '');
    
    // Save to user preferences if authenticated
    if (user?.id) {
      saveUserPreferences();
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      toggleTheme, 
      setEnvironmentTheme,
      currentEnvironment,
      applyEnvironmentTheme
    }}>
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
