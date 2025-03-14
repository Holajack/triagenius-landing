
import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type Step = {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  onNext?: () => void;
};

type WalkthroughState = {
  isActive: boolean;
  currentStepIndex: number;
  steps: Step[];
  hasCompletedTutorial: boolean;
};

type WalkthroughAction = 
  | { type: 'START_WALKTHROUGH'; payload: Step[] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SKIP_WALKTHROUGH' }
  | { type: 'COMPLETE_WALKTHROUGH' }
  | { type: 'SET_HAS_COMPLETED' };

const initialState: WalkthroughState = {
  isActive: false,
  currentStepIndex: 0,
  steps: [],
  hasCompletedTutorial: false,
};

const walkthroughReducer = (state: WalkthroughState, action: WalkthroughAction): WalkthroughState => {
  switch (action.type) {
    case 'START_WALKTHROUGH':
      return {
        ...state,
        isActive: true,
        currentStepIndex: 0,
        steps: action.payload,
      };
    case 'NEXT_STEP':
      // Execute onNext callback if it exists
      const currentStep = state.steps[state.currentStepIndex];
      if (currentStep?.onNext) {
        currentStep.onNext();
      }
      
      // If this is the last step, complete the walkthrough
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
      return {
        ...state,
        currentStepIndex: Math.max(0, state.currentStepIndex - 1),
      };
    case 'SKIP_WALKTHROUGH':
      return {
        ...state,
        isActive: false,
      };
    case 'COMPLETE_WALKTHROUGH':
      return {
        ...state,
        isActive: false,
        hasCompletedTutorial: true,
      };
    case 'SET_HAS_COMPLETED':
      return {
        ...state,
        hasCompletedTutorial: true,
      };
    default:
      return state;
  }
};

type WalkthroughContextType = {
  state: WalkthroughState;
  dispatch: React.Dispatch<WalkthroughAction>;
};

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

export const WalkthroughProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(walkthroughReducer, initialState);
  const location = useLocation();

  // Check if user has completed tutorial from localStorage
  useEffect(() => {
    const hasCompleted = localStorage.getItem('hasCompletedTutorial') === 'true';
    if (hasCompleted) {
      dispatch({ type: 'SET_HAS_COMPLETED' });
    }
  }, []);

  // Save completed status to localStorage
  useEffect(() => {
    if (state.hasCompletedTutorial) {
      localStorage.setItem('hasCompletedTutorial', 'true');
    }
  }, [state.hasCompletedTutorial]);

  // Reset walkthrough when navigating to a different route
  useEffect(() => {
    if (state.isActive) {
      dispatch({ type: 'SKIP_WALKTHROUGH' });
    }
  }, [location.pathname]);

  return (
    <WalkthroughContext.Provider value={{ state, dispatch }}>
      {children}
    </WalkthroughContext.Provider>
  );
};

export const useWalkthrough = () => {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider');
  }
  return context;
};
