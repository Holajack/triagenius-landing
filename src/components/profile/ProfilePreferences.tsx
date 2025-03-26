
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { toast } from "sonner";
import { UserGoal, WorkStyle, StudyEnvironment, SoundPreference } from "@/types/onboarding";
import { PencilIcon, SaveIcon, Loader2Icon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "@/hooks/use-user";
import { useLocation, useNavigate } from "react-router-dom";

// Enable this for debugging environment issues
const DEBUG_ENV = true;

const ProfilePreferences = () => {
  const {
    state,
    dispatch,
    saveOnboardingState,
    isLoading: contextLoading,
    hasUnsavedChanges,
    setHasUnsavedChanges
  } = useOnboarding();
  
  const { user, refreshUser } = useUser();
  const { setEnvironmentTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedState, setEditedState] = useState({
    ...state
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingEnvironment, setIsSavingEnvironment] = useState(false);
  const [lastSavedEnvironment, setLastSavedEnvironment] = useState<string | null>(null);
  const [pendingEnvironment, setPendingEnvironment] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // Add effect to track when environment changes in profile or onboarding
  useEffect(() => {
    if (user?.profile?.last_selected_environment) {
      setLastSavedEnvironment(user.profile.last_selected_environment);
      if (DEBUG_ENV) console.log(`[ProfilePreferences] Initial database environment: ${user.profile.last_selected_environment}`);
    }
  }, [user?.profile?.last_selected_environment]);
  
  // Save function for environment changes only
  const saveEnvironmentToDatabase = async (envValue: string): Promise<boolean> => {
    if (!user || !user.id) {
      console.error("[ProfilePreferences] Cannot save environment - no user");
      return false;
    }
    
    try {
      setIsSavingEnvironment(true);
      
      if (DEBUG_ENV) console.log(`[ProfilePreferences] Saving environment to DB: ${envValue}`);
      
      // First update profiles table - source of truth
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          last_selected_environment: envValue 
        })
        .eq('id', user.id);
        
      if (profileError) {
        console.error("[ProfilePreferences] Error updating profile environment:", profileError);
        return false;
      }
      
      // Then sync with onboarding_preferences for consistency
      const { error: prefError } = await supabase
        .from('onboarding_preferences')
        .update({ 
          learning_environment: envValue 
        })
        .eq('user_id', user.id);
        
      if (prefError) {
        console.error("[ProfilePreferences] Error updating onboarding preferences environment:", prefError);
      }
      
      // Update localStorage after DB update
      localStorage.setItem('environment', envValue);
      
      // Update the last saved environment state
      setLastSavedEnvironment(envValue);
      
      // Force refresh to update the debug view
      await refreshUser();
      
      if (DEBUG_ENV) console.log("[ProfilePreferences] Successfully saved environment to database");
      return true;
    } catch (error) {
      console.error("[ProfilePreferences] Failed to save environment:", error);
      return false;
    } finally {
      setIsSavingEnvironment(false);
    }
  };
  
  const handleEditStart = () => {
    setIsEditing(true);
    setEditedState({
      ...state
    });
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setEditedState({
      ...state
    });
    
    // If we have a pending environment change, revert the visual preview
    if (pendingEnvironment) {
      setPendingEnvironment(null);
    }
  };
  
  // Apply the environment visually but don't save to DB - this is just for preview
  const previewEnvironmentVisually = (value: string) => {
    // Only apply CSS classes for preview effect - no context changes
    document.documentElement.classList.remove(
      'theme-office', 
      'theme-park', 
      'theme-home', 
      'theme-coffee-shop', 
      'theme-library'
    );
    document.documentElement.classList.add(`theme-${value}`);
    document.documentElement.setAttribute('data-environment', value);
  };
  
  // Apply the environment both visually and to the theme context after saving
  const applyEnvironmentFully = (value: string) => {
    // Update theme context
    setEnvironmentTheme(value);
    
    // Apply CSS classes directly for immediate visual feedback 
    document.documentElement.classList.remove(
      'theme-office', 
      'theme-park', 
      'theme-home', 
      'theme-coffee-shop', 
      'theme-library'
    );
    document.documentElement.classList.add(`theme-${value}`);
    document.documentElement.setAttribute('data-environment', value);
  };
  
  const handleChange = async (key: string, value: any) => {
    setEditedState(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
    
    // Special handling for environment changes - only preview them
    if (key === 'environment' && value) {
      if (DEBUG_ENV) console.log(`[ProfilePreferences] Environment change requested: ${value}`);
      
      // Store the pending environment to apply on save
      setPendingEnvironment(value as string);
      
      // Only preview the environment visually
      previewEnvironmentVisually(value);
    }
  };
  
  // Auto-save handler
  const savePreferencesOnExit = useCallback(async () => {
    if (hasUnsavedChanges && isEditing && autoSaveEnabled) {
      if (DEBUG_ENV) console.log("[ProfilePreferences] Auto-saving preferences before exit");
      await handleSave();
      return true;
    }
    
    return false;
  }, [hasUnsavedChanges, isEditing, autoSaveEnabled]);
  
  // Save pending environment changes when leaving the component
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If there are unsaved changes, show confirmation dialog
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    // Listen for navigation events
    const handleRouteChange = async () => {
      await savePreferencesOnExit();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Save on unmount
      savePreferencesOnExit();
    };
  }, [hasUnsavedChanges, savePreferencesOnExit]);

  // Watch for tab changes within profile page
  useEffect(() => {
    // If location hash changes and we have unsaved changes, save them
    const handleHashChange = async () => {
      if (location.hash !== "#preferences" && hasUnsavedChanges && isEditing) {
        await savePreferencesOnExit();
      }
    };

    // Add listener for URL hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [location.hash, hasUnsavedChanges, isEditing, savePreferencesOnExit]);
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // First, save any pending environment changes
      if (pendingEnvironment) {
        const saveSuccess = await saveEnvironmentToDatabase(pendingEnvironment);
        
        if (saveSuccess) {
          // Only now apply the environment change to the theme context
          applyEnvironmentFully(pendingEnvironment);
          setPendingEnvironment(null);
        } else {
          // If save failed, show error
          toast.error("Failed to save environment preference");
          // Do not proceed with other changes
          setIsLoading(false);
          return;
        }
      }
      
      // Update context state
      Object.entries(editedState).forEach(([key, value]) => {
        switch (key) {
          case 'userGoal':
            dispatch({
              type: 'SET_USER_GOAL',
              payload: value as UserGoal
            });
            break;
          case 'workStyle':
            dispatch({
              type: 'SET_WORK_STYLE',
              payload: value as WorkStyle
            });
            break;
          case 'environment':
            dispatch({
              type: 'SET_ENVIRONMENT',
              payload: value as StudyEnvironment
            });
            break;
          case 'soundPreference':
            dispatch({
              type: 'SET_SOUND_PREFERENCE',
              payload: value as SoundPreference
            });
            break;
          case 'weeklyFocusGoal':
            dispatch({
              type: 'SET_WEEKLY_FOCUS_GOAL',
              payload: value as number
            });
            break;
        }
      });

      // Save to database using the onboarding context
      await saveOnboardingState();
      
      // Refresh user data to ensure we have the latest preferences
      await refreshUser();
      
      // Verify environment was saved properly
      if (user?.id && editedState.environment) {
        const { data, error } = await supabase
          .from('profiles')
          .select('last_selected_environment')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          if (data.last_selected_environment !== editedState.environment) {
            if (DEBUG_ENV) console.log(`[ProfilePreferences] Environment verification failed. DB has ${data.last_selected_environment} but should be ${editedState.environment}`);
            
            // Fix the mismatch with a direct update
            await supabase
              .from('profiles')
              .update({ 
                last_selected_environment: editedState.environment 
              })
              .eq('id', user.id);
              
            // Also update onboarding_preferences
            await supabase
              .from('onboarding_preferences')
              .update({ 
                learning_environment: editedState.environment 
              })
              .eq('user_id', user.id);
              
            if (DEBUG_ENV) console.log("[ProfilePreferences] Fixed environment mismatch in database");
          } else {
            if (DEBUG_ENV) console.log("[ProfilePreferences] Environment verification successful");
          }
        }
      }
      
      setIsEditing(false);
      setHasUnsavedChanges(false);
      toast.success("Preferences saved successfully");
    } catch (error) {
      console.error("Error updating preferences:", error);
      // Toast error is already shown in the saveOnboardingState function
    } finally {
      setIsLoading(false);
    }
  };
  
  return <Card className="my-0 py-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Preferences</CardTitle>
          {!isEditing ? (
            <Button onClick={handleEditStart} variant="outline" size="sm" disabled={isLoading || contextLoading || isSavingEnvironment}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={isLoading || contextLoading || isSavingEnvironment}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 my-0 pb-8">
        {(contextLoading || isSavingEnvironment) && <div className="w-full flex justify-center py-4">
            <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
          </div>}
        
        {!contextLoading && <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weekly-focus-goal">Weekly Focus Goal</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="weekly-focus-goal" 
                  disabled={!isEditing || isLoading || isSavingEnvironment} 
                  value={[editedState.weeklyFocusGoal || state.weeklyFocusGoal || 10]} 
                  min={1} 
                  max={40} 
                  step={1} 
                  onValueChange={value => handleChange('weeklyFocusGoal', value[0])}
                  className="flex-1" 
                />
                <span className="text-sm font-medium w-12 text-right">
                  {editedState.weeklyFocusGoal || state.weeklyFocusGoal || 10} hrs
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-goal">Main Goal</Label>
              <Select 
                disabled={!isEditing || isLoading || isSavingEnvironment} 
                value={editedState.userGoal || state.userGoal || ""} 
                onValueChange={value => handleChange('userGoal', value as UserGoal)}
              >
                <SelectTrigger id="user-goal">
                  <SelectValue placeholder="Select your main goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deep-work">Deep Work</SelectItem>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="accountability">Accountability</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work-style">Work Style</Label>
              <Select 
                disabled={!isEditing || isLoading || isSavingEnvironment} 
                value={editedState.workStyle || state.workStyle || ""} 
                onValueChange={value => handleChange('workStyle', value as WorkStyle)}
              >
                <SelectTrigger id="work-style">
                  <SelectValue placeholder="Select your work style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deep-work">Deep Work</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="pomodoro">Sprints</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select 
                disabled={!isEditing || isLoading || isSavingEnvironment} 
                value={editedState.environment || state.environment || ""} 
                onValueChange={value => handleChange('environment', value as StudyEnvironment)}
              >
                <SelectTrigger id="environment">
                  <SelectValue placeholder="Select your preferred environment" />
                </SelectTrigger>
                <SelectContent position="popper" className="w-full z-50">
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="library">Library</SelectItem>
                  <SelectItem value="coffee-shop">Coffee Shop</SelectItem>
                  <SelectItem value="park">Park/Outdoors</SelectItem>
                </SelectContent>
              </Select>
              {(DEBUG_ENV || pendingEnvironment) && (
                <p className="text-xs text-muted-foreground">
                  {isSavingEnvironment ? 'Saving environment...' : 
                    pendingEnvironment ? `Preview: ${pendingEnvironment} (click Save to apply)` : 
                    `Current: ${lastSavedEnvironment || state.environment}`}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sound-preference">Sound Preference</Label>
              <Select 
                disabled={!isEditing || isLoading || isSavingEnvironment} 
                value={editedState.soundPreference || state.soundPreference || ""} 
                onValueChange={value => handleChange('soundPreference', value as SoundPreference)}
              >
                <SelectTrigger id="sound-preference">
                  <SelectValue placeholder="Select your sound preference" />
                </SelectTrigger>
                <SelectContent position="popper" className="w-full z-50">
                  <SelectItem value="lo-fi">Lo-fi</SelectItem>
                  <SelectItem value="ambient">Ambient</SelectItem>
                  <SelectItem value="nature">Nature</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="silence">Silence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>}
      </CardContent>
      
      {isEditing && (
        <CardFooter className="pt-2 pb-4 px-6 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isLoading || contextLoading || isSavingEnvironment || !hasUnsavedChanges}
            className="w-full md:w-auto"
          >
            {isLoading || contextLoading || isSavingEnvironment ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>;
};

export default ProfilePreferences;
