
import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { OnboardingState, UserGoal, WorkStyle, StudyEnvironment, SoundPreference } from '@/types/onboarding';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type OnboardingAction = 
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_USER_GOAL'; payload: UserGoal }
  | { type: 'SET_WORK_STYLE'; payload: WorkStyle }
  | { type: 'SET_ENVIRONMENT'; payload: StudyEnvironment }
  | { type: 'SET_SOUND_PREFERENCE'; payload: SoundPreference }
  | { type: 'SET_WEEKLY_FOCUS_GOAL'; payload: number }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'LOAD_ONBOARDING_STATE'; payload: Partial<OnboardingState> };

const initialState: OnboardingState = {
  step: 0,
  isComplete: false,
  weeklyFocusGoal: 10, // Default weekly focus goal in hours
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
    case 'SET_WEEKLY_FOCUS_GOAL':
      return { ...state, weeklyFocusGoal: action.payload };
    case 'COMPLETE_ONBOARDING':
      return { ...state, isComplete: true };
    case 'RESET_ONBOARDING':
      return initialState;
    case 'LOAD_ONBOARDING_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

type OnboardingContextType = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  saveOnboardingState: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  
  // Load onboarding state from Supabase when auth state changes
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('onboarding_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            console.error('Error loading onboarding state:', error);
            return;
          }
          
          if (data) {
            const onboardingState: Partial<OnboardingState> = {
              isComplete: data.is_onboarding_complete || false,
              userGoal: data.user_goal as UserGoal,
              workStyle: data.work_style as WorkStyle,
              environment: data.learning_environment as StudyEnvironment,
              soundPreference: data.sound_preference as SoundPreference,
              weeklyFocusGoal: data.weekly_focus_goal || 10,
            };
            
            dispatch({ type: 'LOAD_ONBOARDING_STATE', payload: onboardingState });
          }
        }
      } catch (error) {
        console.error('Error in loadOnboardingState:', error);
      }
    };
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadOnboardingState();
    });
    
    // Load onboarding state on initial render
    loadOnboardingState();
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Save onboarding state to Supabase
  const saveOnboardingState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to save preferences');
        return;
      }
      
      const { error } = await supabase
        .from('onboarding_preferences')
        .upsert({
          user_id: user.id,
          user_goal: state.userGoal,
          work_style: state.workStyle,
          learning_environment: state.environment,
          sound_preference: state.soundPreference,
          weekly_focus_goal: state.weeklyFocusGoal,
          is_onboarding_complete: state.isComplete,
        }, { onConflict: 'user_id' });
        
      if (error) {
        toast.error('Failed to save preferences');
        console.error('Error saving onboarding state:', error);
        return;
      }
      
      toast.success('Preferences saved successfully');
    } catch (error) {
      toast.error('An error occurred while saving preferences');
      console.error('Error in saveOnboardingState:', error);
    }
  };

  return (
    <OnboardingContext.Provider value={{ state, dispatch, saveOnboardingState }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
