
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { OnboardingState, UserGoal, WorkStyle, StudyEnvironment, SoundPreference } from '@/types/onboarding';

type OnboardingAction = 
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_USER_GOAL'; payload: UserGoal }
  | { type: 'SET_WORK_STYLE'; payload: WorkStyle }
  | { type: 'SET_ENVIRONMENT'; payload: StudyEnvironment; meta?: { color: string } }
  | { type: 'SET_SOUND_PREFERENCE'; payload: SoundPreference }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ONBOARDING' };

const initialState: OnboardingState = {
  step: 0,
  isComplete: false,
  environmentColor: '#7C3AED', // Default purple color
};

const onboardingReducer = (state: OnboardingState, action: OnboardingAction): OnboardingState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_USER_GOAL':
      return { ...state, userGoal: action.payload };
    case 'SET_WORK_STYLE':
      return { ...state, workStyle: action.payload };
    case 'SET_ENVIRONMENT':
      return { 
        ...state, 
        environment: action.payload,
        environmentColor: action.meta?.color || state.environmentColor
      };
    case 'SET_SOUND_PREFERENCE':
      return { ...state, soundPreference: action.payload };
    case 'COMPLETE_ONBOARDING':
      return { ...state, isComplete: true };
    case 'RESET_ONBOARDING':
      return initialState;
    default:
      return state;
  }
};

type OnboardingContextType = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  return (
    <OnboardingContext.Provider value={{ state, dispatch }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
