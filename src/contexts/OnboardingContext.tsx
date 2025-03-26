
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
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  
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
      
      // Update the last_selected_environment in profiles table to ensure synchronization
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          last_selected_environment: state.environment
        })
        .eq('id', user.id);
      
      if (profileUpdateError) {
        console.error('Error updating profile environment:', profileUpdateError);
        // Don't throw here, as we've already updated the main preferences
      }
      
      // Save to localStorage for faster loading
      localStorage.setItem('userPreferences', JSON.stringify({
        userGoal: state.userGoal,
        workStyle: state.workStyle,
        environment: state.environment,
        soundPreference: state.soundPreference,
        weeklyFocusGoal: state.weeklyFocusGoal,
      }));
      
      // Also update the environment in localStorage directly for immediate application
      if (state.environment) {
        localStorage.setItem('environment', state.environment);
      }
      
      setHasUnsavedChanges(false);
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
        
        // First try to load from localStorage for faster display
        const savedPrefs = localStorage.getItem('userPreferences');
        if (savedPrefs) {
          const localPrefs = JSON.parse(savedPrefs);
          dispatch({ type: 'LOAD_ONBOARDING_STATE', payload: localPrefs });
        }
        
        // Then fetch from Supabase for accurate data
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // First check if there's a last_selected_environment in profiles
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('last_selected_environment')
            .eq('id', user.id)
            .maybeSingle();
            
          let selectedEnvironment: StudyEnvironment | undefined = undefined;
          
          if (!profileError && profileData && profileData.last_selected_environment) {
            selectedEnvironment = profileData.last_selected_environment as StudyEnvironment;
            
            // Update localStorage with the latest environment from profiles
            localStorage.setItem('environment', selectedEnvironment);
          }
          
          // Then get the rest of the onboarding preferences
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
              // Use the selected environment from profiles if available, otherwise use the one from onboarding_preferences
              environment: selectedEnvironment || (data.learning_environment as StudyEnvironment),
              soundPreference: data.sound_preference as SoundPreference,
              weeklyFocusGoal: data.weekly_focus_goal || 10,
            };
            
            dispatch({ type: 'LOAD_ONBOARDING_STATE', payload: onboardingState });
            
            // Update localStorage with the latest data from the database
            localStorage.setItem('userPreferences', JSON.stringify({
              userGoal: data.user_goal,
              workStyle: data.work_style,
              environment: selectedEnvironment || data.learning_environment,
              soundPreference: data.sound_preference,
              weeklyFocusGoal: data.weekly_focus_goal || 10,
            }));
            
            // Update the onboarding_preferences table if there's a mismatch between profiles and onboarding_preferences
            if (selectedEnvironment && data.learning_environment !== selectedEnvironment) {
              console.log('Syncing environment preferences, updating onboarding_preferences to match profiles');
              
              await supabase
                .from('onboarding_preferences')
                .update({
                  learning_environment: selectedEnvironment
                })
                .eq('user_id', user.id);
            }
          } else if (selectedEnvironment) {
            // If we only have an environment from profiles but no onboarding preferences,
            // at least update the environment in the state
            dispatch({ 
              type: 'LOAD_ONBOARDING_STATE', 
              payload: { environment: selectedEnvironment } 
            });
            
            localStorage.setItem('environment', selectedEnvironment);
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
    isLoading,
    hasUnsavedChanges,
    setHasUnsavedChanges
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
