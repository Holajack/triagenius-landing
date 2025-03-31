
// Add the wasExited property to the SavedFocusSession type
export interface SavedFocusSession {
  milestone: number;
  segmentProgress: number;
  isPaused: boolean;
  timestamp: string;
  remainingTime: number;
  environment?: string;
  wasExited?: boolean; // New property to track if user exited the session
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
