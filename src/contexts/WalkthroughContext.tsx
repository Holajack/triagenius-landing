import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

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
  visitedPages: Record<string, boolean>;
};

// Action types
type WalkthroughAction =
  | { type: 'START_WALKTHROUGH'; payload: WalkthroughStep[] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'END_WALKTHROUGH' }
  | { type: 'SKIP_WALKTHROUGH' }
  | { type: 'SET_COMPLETED' }
  | { type: 'MARK_PAGE_VISITED'; payload: string };

// Initial state
const initialState: WalkthroughState = {
  isActive: false,
  steps: [],
  currentStepIndex: 0,
  hasCompletedTutorial: false,
  visitedPages: {},
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
    case 'MARK_PAGE_VISITED':
      return {
        ...state,
        visitedPages: {
          ...state.visitedPages,
          [action.payload]: true
        }
      };
    default:
      return state;
  }
}

// Context type
type WalkthroughContextType = {
  state: WalkthroughState;
  dispatch: React.Dispatch<WalkthroughAction>;
  hasVisitedPage: (pageName: string) => boolean;
  markPageVisited: (pageName: string) => void;
  startWalkthrough: (steps: WalkthroughStep[]) => void;
};

// Create context
const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

// Provider component with explicit React.FC typing
export const WalkthroughProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(walkthroughReducer, initialState);

  // Inject walkthrough highlight styles
  useEffect(() => {
    // Create style element for walkthrough highlights if it doesn't exist
    if (!document.getElementById('walkthrough-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'walkthrough-styles';
      styleEl.innerHTML = `
        .walkthrough-highlight {
          position: relative !important;
          z-index: 50 !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.7), 0 0 15px rgba(139, 92, 246, 0.5) !important;
          border-radius: 4px !important;
          transition: box-shadow 0.3s ease-in-out !important;
        }
        
        @keyframes walkthrough-pulse {
          0% { box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.4), 0 0 10px rgba(139, 92, 246, 0.2); }
          50% { box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.6), 0 0 15px rgba(139, 92, 246, 0.4); }
          100% { box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.4), 0 0 10px rgba(139, 92, 246, 0.2); }
        }
        
        .walkthrough-highlight-pulse {
          animation: walkthrough-pulse 2s infinite ease-in-out;
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    return () => {
      // Remove styles when provider unmounts
      const styleEl = document.getElementById('walkthrough-styles');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);

  // Load completed status and visited pages from localStorage
  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem('hasCompletedTutorial');
      if (hasCompleted === 'true') {
        dispatch({ type: 'SET_COMPLETED' });
      }
      
      // Load visited pages
      const visitedPagesString = localStorage.getItem('visitedPages');
      if (visitedPagesString) {
        const visitedPages = JSON.parse(visitedPagesString);
        Object.keys(visitedPages).forEach(page => {
          dispatch({ type: 'MARK_PAGE_VISITED', payload: page });
        });
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }, []);

  // Save completed status to localStorage
  useEffect(() => {
    try {
      if (state.hasCompletedTutorial) {
        localStorage.setItem('hasCompletedTutorial', 'true');
      }
      
      // Save visited pages
      localStorage.setItem('visitedPages', JSON.stringify(state.visitedPages));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [state.hasCompletedTutorial, state.visitedPages]);

  // Helper functions to check and mark pages as visited
  const hasVisitedPage = (pageName: string): boolean => {
    return !!state.visitedPages[pageName];
  };

  const markPageVisited = (pageName: string) => {
    dispatch({ type: 'MARK_PAGE_VISITED', payload: pageName });
  };
  
  const startWalkthrough = (steps: WalkthroughStep[]) => {
    dispatch({ type: 'START_WALKTHROUGH', payload: steps });
  };

  return (
    <WalkthroughContext.Provider value={{ 
      state, 
      dispatch, 
      hasVisitedPage, 
      markPageVisited,
      startWalkthrough 
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
