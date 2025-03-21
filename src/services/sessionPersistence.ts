
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Defines the structure of saved focus session data
export interface SavedFocusSession {
  id: string;
  milestone: number;
  duration: number;
  isPaused: boolean;
  remainingTime: number;
  timestamp: string;
  environment: string;
  segmentProgress: number;
}

// Structure for all persisted session data
export interface PersistedSessionData {
  preferences: {
    theme: string;
    environment: string;
    soundPreference: string;
    lowPowerMode: boolean;
  };
  focusSession: SavedFocusSession | null;
  lastRoute: string;
}

// Default session data if nothing is found
const defaultSessionData: PersistedSessionData = {
  preferences: {
    theme: 'light',
    environment: 'office',
    soundPreference: 'none',
    lowPowerMode: false
  },
  focusSession: null,
  lastRoute: '/dashboard',
};

/**
 * Saves the user's session data to Supabase and localStorage
 */
export const saveUserSession = async (userId: string | undefined): Promise<void> => {
  if (!userId) {
    console.log("No user ID provided, skipping session save");
    return;
  }

  try {
    // Get theme and environment preferences
    const theme = localStorage.getItem('theme') || 'light';
    const environment = localStorage.getItem('environment') || 'office';
    const soundPreference = localStorage.getItem('soundPreference') || 'none';
    
    // Get focus session data if exists
    const focusSessionStr = localStorage.getItem('currentFocusSession');
    const focusSession = focusSessionStr ? JSON.parse(focusSessionStr) : null;
    
    // Get current route
    const lastRoute = window.location.pathname;
    
    // Low power mode preference
    const lowPowerMode = localStorage.getItem('lowPowerMode') === 'true';
    
    // Construct session data object
    const sessionData: PersistedSessionData = {
      preferences: {
        theme,
        environment,
        soundPreference,
        lowPowerMode
      },
      focusSession,
      lastRoute
    };
    
    // Save to localStorage as a backup
    localStorage.setItem(`sessionData_${userId}`, JSON.stringify(sessionData));
    
    // Save to Supabase for persistence across devices
    const { error } = await supabase
      .from('profiles')
      .update({ 
        preferences: {
          ...sessionData.preferences,
          lastSession: sessionData
        }
      })
      .eq('id', userId);
      
    if (error) {
      console.error("Error saving session:", error);
    } else {
      console.log("Session saved successfully");
    }
    
  } catch (error) {
    console.error("Failed to save session data:", error);
  }
};

/**
 * Loads the user's session data from Supabase or falls back to localStorage
 */
export const loadUserSession = async (userId: string | undefined): Promise<PersistedSessionData> => {
  if (!userId) {
    console.log("No user ID provided, returning default session");
    return defaultSessionData;
  }
  
  try {
    // Try to get from Supabase first
    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();
      
    if (error) {
      throw error;
    }
    
    // Check if preferences and lastSession exist
    if (data?.preferences?.lastSession) {
      console.log("Session loaded from Supabase");
      return data.preferences.lastSession as PersistedSessionData;
    }
    
    // Fall back to localStorage if Supabase doesn't have it
    const localData = localStorage.getItem(`sessionData_${userId}`);
    if (localData) {
      console.log("Session loaded from localStorage");
      return JSON.parse(localData) as PersistedSessionData;
    }
    
    console.log("No saved session found, using defaults");
    return defaultSessionData;
    
  } catch (error) {
    console.error("Failed to load session data:", error);
    
    // Try local storage as a fallback
    try {
      const localData = localStorage.getItem(`sessionData_${userId}`);
      if (localData) {
        return JSON.parse(localData) as PersistedSessionData;
      }
    } catch (e) {
      console.error("Error parsing local session data:", e);
    }
    
    return defaultSessionData;
  }
};

/**
 * Applies loaded session preferences to the current session
 */
export const applySessionPreferences = (
  sessionData: PersistedSessionData,
  setTheme?: (theme: 'light' | 'dark') => void,
  setEnvironmentTheme?: (env: string) => void
): void => {
  try {
    // Apply theme
    const { theme, environment, soundPreference, lowPowerMode } = sessionData.preferences;
    
    localStorage.setItem('theme', theme);
    localStorage.setItem('environment', environment);
    localStorage.setItem('soundPreference', soundPreference);
    localStorage.setItem('lowPowerMode', lowPowerMode ? 'true' : 'false');
    
    // Use provided theme setter function if available
    if (setTheme && theme) {
      setTheme(theme as 'light' | 'dark');
    }
    
    // Use provided environment setter if available
    if (setEnvironmentTheme && environment) {
      setEnvironmentTheme(environment);
    }
    
    // Apply to document classes for immediate visual feedback
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Apply environment theme classes
    document.documentElement.classList.remove(
      'theme-office', 
      'theme-park', 
      'theme-home', 
      'theme-coffee-shop', 
      'theme-library'
    );
    
    if (environment) {
      document.documentElement.classList.add(`theme-${environment}`);
      document.documentElement.setAttribute('data-environment', environment);
    }
    
  } catch (error) {
    console.error("Error applying session preferences:", error);
  }
};

/**
 * Save current focus session state
 */
export const saveFocusSessionState = (sessionData: Partial<SavedFocusSession>): void => {
  try {
    const existingData = localStorage.getItem('currentFocusSession');
    const currentData = existingData ? JSON.parse(existingData) : {};
    
    const updatedSession = {
      ...currentData,
      ...sessionData,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('currentFocusSession', JSON.stringify(updatedSession));
    console.log("Focus session state saved:", updatedSession);
  } catch (error) {
    console.error("Error saving focus session state:", error);
  }
};

/**
 * Clear the saved focus session state
 */
export const clearFocusSessionState = (): void => {
  localStorage.removeItem('currentFocusSession');
};

/**
 * Check if there is a saved focus session to resume
 */
export const hasSavedFocusSession = (): boolean => {
  const sessionData = localStorage.getItem('currentFocusSession');
  return !!sessionData;
};

/**
 * Get the saved focus session data if available
 */
export const getSavedFocusSession = (): SavedFocusSession | null => {
  try {
    const sessionData = localStorage.getItem('currentFocusSession');
    if (!sessionData) return null;
    
    return JSON.parse(sessionData);
  } catch (error) {
    console.error("Error retrieving saved focus session:", error);
    return null;
  }
};
