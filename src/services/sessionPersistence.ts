
// Add the wasExited property to the SavedFocusSession type
export interface SavedFocusSession {
  milestone: number; // Keep as required
  segmentProgress: number;
  isPaused: boolean;
  timestamp: string;
  remainingTime: number;
  environment?: string;
  wasExited?: boolean; 
  currentTaskIndex?: number;
  currentTaskCompleted?: boolean;
  taskPriorities?: string[];
  priorityMode?: string;
  lastActiveTime?: number; // Added to track when the tab was last active
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
      timestamp: new Date().toISOString(),
      lastActiveTime: Date.now() // Always update the last active time
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
    // Get task priorities and mode
    const taskPriorities = localStorage.getItem('focusTaskPriority');
    const priorityMode = localStorage.getItem('priorityMode');
    const currentTaskIndex = localStorage.getItem('currentTaskIndex');
    const currentTaskCompleted = localStorage.getItem('currentTaskCompleted');
    
    // Save current app state
    const sessionData: SavedUserSession = {
      theme: localStorage.getItem('theme') || undefined,
      environment: localStorage.getItem('environment') || undefined,
      lastRoute: window.location.pathname,
      lastVisited: new Date().toISOString(),
      focusSession: {
        ...(getSavedFocusSession() || {}),
        // Ensure the required milestone field is always provided
        milestone: getSavedFocusSession()?.milestone || 0,
        segmentProgress: getSavedFocusSession()?.segmentProgress || 0,
        isPaused: getSavedFocusSession()?.isPaused || false,
        timestamp: new Date().toISOString(),
        remainingTime: getSavedFocusSession()?.remainingTime || 0,
        environment: localStorage.getItem('environment') || undefined,
        lastActiveTime: Date.now(),
        taskPriorities: taskPriorities ? JSON.parse(taskPriorities) : undefined,
        priorityMode: priorityMode || undefined,
        currentTaskIndex: currentTaskIndex ? parseInt(currentTaskIndex, 10) : undefined,
        currentTaskCompleted: currentTaskCompleted === 'true'
      }
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
    // Save the focus session state
    localStorage.setItem('focusSessionState', JSON.stringify(savedSession.focusSession));
    
    // Also restore task-related data
    if (savedSession.focusSession.taskPriorities) {
      localStorage.setItem('focusTaskPriority', JSON.stringify(savedSession.focusSession.taskPriorities));
    }
    
    if (savedSession.focusSession.priorityMode) {
      localStorage.setItem('priorityMode', savedSession.focusSession.priorityMode);
    }
    
    if (savedSession.focusSession.currentTaskIndex !== undefined) {
      localStorage.setItem('currentTaskIndex', savedSession.focusSession.currentTaskIndex.toString());
    }
    
    if (savedSession.focusSession.currentTaskCompleted !== undefined) {
      localStorage.setItem('currentTaskCompleted', savedSession.focusSession.currentTaskCompleted.toString());
    }
  }
};
