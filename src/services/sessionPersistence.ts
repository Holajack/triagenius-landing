
// Add the wasExited property to the SavedFocusSession type
export interface SavedFocusSession {
  milestone: number;
  segmentProgress: number;
  isPaused: boolean;
  timestamp: string;
  remainingTime: number;
  environment?: string;
  wasExited?: boolean; // New property to track if user exited the session
  currentTaskIndex?: number; // Track the current task
  currentTaskCompleted?: boolean; // Track if the current task is completed
}

export interface SavedUserSession {
  theme?: string;
  environment?: string;
  lastRoute?: string;
  focusSession?: SavedFocusSession;
  lastVisited?: string;
  preferences?: Record<string, any>;
}

export const saveFocusSessionState = (data: Partial<SavedFocusSession>) => {
  try {
    const currentData = getSavedFocusSession() || {};
    const updatedData = {
      ...currentData,
      ...data,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('focusSessionState', JSON.stringify(updatedData));
    return true;
  } catch (error) {
    console.error('Error saving focus session state', error);
    return false;
  }
};

export const getSavedFocusSession = (): SavedFocusSession | null => {
  try {
    const savedData = localStorage.getItem('focusSessionState');
    if (savedData) {
      return JSON.parse(savedData) as SavedFocusSession;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving focus session state', error);
    return null;
  }
};

export const clearFocusSessionState = () => {
  try {
    localStorage.removeItem('focusSessionState');
    return true;
  } catch (error) {
    console.error('Error clearing focus session state', error);
    return false;
  }
};

// Added functions for user session persistence
export const saveUserSession = async (userId: string) => {
  try {
    // Save current app state
    const sessionData: SavedUserSession = {
      theme: localStorage.getItem('theme') || undefined,
      environment: localStorage.getItem('environment') || undefined,
      lastRoute: window.location.pathname,
      lastVisited: new Date().toISOString(),
      focusSession: getSavedFocusSession() || undefined
    };
    
    // Try to save to localStorage
    localStorage.setItem(`userSession_${userId}`, JSON.stringify(sessionData));
    
    return true;
  } catch (error) {
    console.error('Error saving user session', error);
    return false;
  }
};

export const loadUserSession = async (userId: string): Promise<SavedUserSession | null> => {
  try {
    const savedSession = localStorage.getItem(`userSession_${userId}`);
    if (savedSession) {
      return JSON.parse(savedSession) as SavedUserSession;
    }
    return null;
  } catch (error) {
    console.error('Error loading user session', error);
    return null;
  }
};

export const applySessionPreferences = (
  savedSession: SavedUserSession | null, 
  setTheme?: (theme: string) => void,
  setEnvironmentTheme?: (env: string) => void,
  overrideEnvironment?: string
) => {
  if (!savedSession) return;
  
  // Apply theme if available and setter provided
  if (savedSession.theme && setTheme) {
    setTheme(savedSession.theme);
    localStorage.setItem('theme', savedSession.theme);
  }
  
  // Apply environment if available and not overridden
  if (savedSession.environment && !overrideEnvironment && setEnvironmentTheme) {
    setEnvironmentTheme(savedSession.environment);
    localStorage.setItem('environment', savedSession.environment);
  } else if (overrideEnvironment && setEnvironmentTheme) {
    // Use the override environment
    setEnvironmentTheme(overrideEnvironment);
    localStorage.setItem('environment', overrideEnvironment);
  }
  
  // Restore focus session if it exists
  if (savedSession.focusSession) {
    localStorage.setItem('focusSessionState', JSON.stringify(savedSession.focusSession));
  }
};
