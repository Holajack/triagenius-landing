import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
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

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
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
}

type OnboardingContextType = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  saveOnboardingState: () => Promise<void>;
  isLoading: boolean; // Added loading state
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Explicitly type the component as React.FC to ensure React recognizes it properly
export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const [isLoading, setIsLoading] = React.useState(false); // Added loading state
  
  // Save onboarding state to Supabase
  const saveOnboardingState = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to save preferences");
        return;
      }
      
      // Check if a record exists for this user
      const { data: existingData, error: fetchError } = await supabase
        .from('onboarding_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (fetchError) {
        console.error('Error checking for existing preferences:', fetchError);
        throw new Error(fetchError.message);
      }
      
      let saveError;
      
      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('onboarding_preferences')
          .update({
            user_goal: state.userGoal,
            work_style: state.workStyle,
            learning_environment: state.environment,
            sound_preference: state.soundPreference,
            weekly_focus_goal: state.weeklyFocusGoal,
            is_onboarding_complete: state.isComplete,
          })
          .eq('user_id', user.id);
          
        saveError = error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('onboarding_preferences')
          .insert({
            user_id: user.id,
            user_goal: state.userGoal,
            work_style: state.workStyle,
            learning_environment: state.environment,
            sound_preference: state.soundPreference,
            weekly_focus_goal: state.weeklyFocusGoal,
            is_onboarding_complete: state.isComplete,
          });
          
        saveError = error;
      }
        
      if (saveError) {
        console.error('Error saving onboarding state:', saveError);
        throw new Error(saveError.message);
      }
      
      toast.success("Preferences saved successfully");
    } catch (error: any) {
      console.error('Error in saveOnboardingState:', error);
      toast.error(`Failed to save preferences: ${error.message || "An unknown error occurred"}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load onboarding state from Supabase when auth state changes
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('onboarding_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (error && error.code !== 'PGRST116') {
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
      } finally {
        setIsLoading(false);
      }
    };
    
    // Load onboarding state on initial render
    loadOnboardingState();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadOnboardingState();
    });
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const contextValue = {
    state,
    dispatch,
    saveOnboardingState,
    isLoading
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
