
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
  visitedPages: string[]; // Track which pages have been visited and walked through
  isFirstTimeUser: boolean; // Track if this is a first-time user
  isMobileOptimized: boolean; // Track if the walkthrough is mobile-optimized
};

// Action types
type WalkthroughAction =
  | { type: 'START_WALKTHROUGH'; payload: WalkthroughStep[]; pagePath?: string }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'END_WALKTHROUGH'; pagePath?: string }
  | { type: 'SKIP_WALKTHROUGH'; pagePath?: string }
  | { type: 'SET_COMPLETED' }
  | { type: 'ADD_VISITED_PAGE'; payload: string }
  | { type: 'SET_MOBILE_OPTIMIZED'; payload: boolean };

// Initial state
const initialState: WalkthroughState = {
  isActive: false,
  steps: [],
  currentStepIndex: 0,
  hasCompletedTutorial: false,
  visitedPages: [],
  isFirstTimeUser: true,
  isMobileOptimized: false,
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
        visitedPages: action.pagePath 
          ? [...state.visitedPages, action.pagePath]
          : state.visitedPages
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
        visitedPages: action.pagePath 
          ? [...state.visitedPages, action.pagePath]
          : state.visitedPages
      };
    case 'SKIP_WALKTHROUGH':
      return {
        ...state,
        isActive: false,
        visitedPages: action.pagePath 
          ? [...state.visitedPages, action.pagePath]
          : state.visitedPages
      };
    case 'SET_COMPLETED':
      return {
        ...state,
        hasCompletedTutorial: true,
      };
    case 'ADD_VISITED_PAGE':
      if (state.visitedPages.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        visitedPages: [...state.visitedPages, action.payload]
      };
    case 'SET_MOBILE_OPTIMIZED':
      return {
        ...state,
        isMobileOptimized: action.payload
      };
    default:
      return state;
  }
}

// Context type
type WalkthroughContextType = {
  state: WalkthroughState;
  dispatch: React.Dispatch<WalkthroughAction>;
  hasVisitedPage: (path: string) => boolean;
  shouldShowWalkthrough: (path: string) => boolean;
};

// Create context
const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

// Provider component with explicit React.FC typing
export const WalkthroughProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(walkthroughReducer, initialState);

  // Load completion status and visited pages from localStorage
  React.useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem('hasCompletedTutorial');
      const visitedPages = localStorage.getItem('walkthroughVisitedPages');
      const isFirstTimeUser = localStorage.getItem('isFirstTimeUser');
      
      if (hasCompleted === 'true') {
        dispatch({ type: 'SET_COMPLETED' });
      }
      
      if (visitedPages) {
        const pages = JSON.parse(visitedPages);
        pages.forEach((page: string) => {
          dispatch({ type: 'ADD_VISITED_PAGE', payload: page });
        });
      }
      
      // Set mobile optimization based on device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      dispatch({ type: 'SET_MOBILE_OPTIMIZED', payload: isMobile });
      
      if (isFirstTimeUser === null) {
        localStorage.setItem('isFirstTimeUser', 'false');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }, []);

  // Save completed status and visited pages to localStorage
  React.useEffect(() => {
    try {
      if (state.hasCompletedTutorial) {
        localStorage.setItem('hasCompletedTutorial', 'true');
      }
      
      localStorage.setItem('walkthroughVisitedPages', JSON.stringify(state.visitedPages));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [state.hasCompletedTutorial, state.visitedPages]);

  // Helper functions
  const hasVisitedPage = (path: string): boolean => {
    return state.visitedPages.includes(path);
  };
  
  const shouldShowWalkthrough = (path: string): boolean => {
    return !hasVisitedPage(path) && !state.isActive;
  };

  return (
    <WalkthroughContext.Provider value={{ 
      state, 
      dispatch, 
      hasVisitedPage, 
      shouldShowWalkthrough 
    }}>
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
