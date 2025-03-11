
import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { OnboardingState, UserGoal, WorkStyle, StudyEnvironment, SoundPreference } from '@/types/onboarding';
import { useUser } from '@clerk/clerk-react';

type OnboardingAction = 
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_USER_GOAL'; payload: UserGoal }
  | { type: 'SET_WORK_STYLE'; payload: WorkStyle }
  | { type: 'SET_ENVIRONMENT'; payload: StudyEnvironment }
  | { type: 'SET_SOUND_PREFERENCE'; payload: SoundPreference }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'LOAD_SAVED_STATE'; payload: Partial<OnboardingState> };

const initialState: OnboardingState = {
  step: 0,
  isComplete: false,
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
      return { ...state, environment: action.payload };
    case 'SET_SOUND_PREFERENCE':
      return { ...state, soundPreference: action.payload };
    case 'COMPLETE_ONBOARDING':
      return { ...state, isComplete: true };
    case 'RESET_ONBOARDING':
      return initialState;
    case 'LOAD_SAVED_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

type OnboardingContextType = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  savePreferences: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const { isSignedIn, user } = useUser();

  // Load saved preferences when user logs in
  useEffect(() => {
    if (isSignedIn && user) {
      const savedPreferences = localStorage.getItem(`focus_preferences_${user.id}`);
      if (savedPreferences) {
        try {
          const parsedPreferences = JSON.parse(savedPreferences);
          dispatch({ 
            type: 'LOAD_SAVED_STATE', 
            payload: parsedPreferences 
          });
        } catch (error) {
          console.error('Failed to parse saved preferences', error);
        }
      }
    }
  }, [isSignedIn, user]);

  // Function to save preferences to localStorage
  const savePreferences = () => {
    if (isSignedIn && user) {
      const preferencesToSave = {
        userGoal: state.userGoal,
        workStyle: state.workStyle,
        environment: state.environment,
        soundPreference: state.soundPreference,
        isComplete: state.isComplete
      };
      localStorage.setItem(`focus_preferences_${user.id}`, JSON.stringify(preferencesToSave));
    }
  };

  return (
    <OnboardingContext.Provider value={{ state, dispatch, savePreferences }}>
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
