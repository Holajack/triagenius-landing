
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types for walkthrough steps
export type WalkthroughStep = {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  placement: 'top' | 'right' | 'bottom' | 'left';
};

// State type
type WalkthroughState = {
  isActive: boolean;
  steps: WalkthroughStep[];
  currentStepIndex: number;
  hasCompletedTutorial: boolean;
};

// Action types
type WalkthroughAction =
  | { type: 'START_WALKTHROUGH'; payload: WalkthroughStep[] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'END_WALKTHROUGH' }
  | { type: 'SKIP_WALKTHROUGH' }
  | { type: 'SET_COMPLETED' };

// Initial state
const initialState: WalkthroughState = {
  isActive: false,
  steps: [],
  currentStepIndex: 0,
  hasCompletedTutorial: false,
};

// Reducer function
function walkthroughReducer(state: WalkthroughState, action: WalkthroughAction): WalkthroughState {
  switch (action.type) {
    case 'START_WALKTHROUGH':
      return {
        ...state,
        isActive: true,
        steps: action.payload,
        currentStepIndex: 0,
      };
    case 'NEXT_STEP':
      if (state.currentStepIndex >= state.steps.length - 1) {
        return {
          ...state,
          isActive: false,
          hasCompletedTutorial: true,
        };
      }
      return {
        ...state,
        currentStepIndex: state.currentStepIndex + 1,
      };
    case 'PREVIOUS_STEP':
      if (state.currentStepIndex <= 0) {
        return state;
      }
      return {
        ...state,
        currentStepIndex: state.currentStepIndex - 1,
      };
    case 'END_WALKTHROUGH':
      return {
        ...state,
        isActive: false,
        hasCompletedTutorial: true,
      };
    case 'SKIP_WALKTHROUGH':
      return {
        ...state,
        isActive: false,
      };
    case 'SET_COMPLETED':
      return {
        ...state,
        hasCompletedTutorial: true,
      };
    default:
      return state;
  }
}

// Context type
type WalkthroughContextType = {
  state: WalkthroughState;
  dispatch: React.Dispatch<WalkthroughAction>;
};

// Create context
const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

// Provider component
export const WalkthroughProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(walkthroughReducer, initialState);

  // Load completed status from localStorage
  React.useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem('hasCompletedTutorial');
      if (hasCompleted === 'true') {
        dispatch({ type: 'SET_COMPLETED' });
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }, []);

  // Save completed status to localStorage
  React.useEffect(() => {
    try {
      if (state.hasCompletedTutorial) {
        localStorage.setItem('hasCompletedTutorial', 'true');
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [state.hasCompletedTutorial]);

  return (
    <WalkthroughContext.Provider value={{ state, dispatch }}>
      {children}
    </WalkthroughContext.Provider>
  );
};

// Hook to use the context
export function useWalkthrough() {
  const context = useContext(WalkthroughContext);
  if (context === undefined) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider');
  }
  return context;
}
