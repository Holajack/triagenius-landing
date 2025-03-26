
import { useState, useEffect } from "react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedState, setEditedState] = useState({
    ...state
  });
  const [isLoading, setIsLoading] = useState(false);
  
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
  };
  
  const handleChange = async (key: string, value: any) => {
    setEditedState(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
    
    // For environment changes, apply them immediately for better user experience
    // but also update the database directly to ensure consistency
    if (key === 'environment' && value) {
      if (DEBUG_ENV) console.log(`[ProfilePreferences] Immediate environment update: ${value}`);
      
      // Update theme context
      setEnvironmentTheme(value);
      
      // Update localStorage
      localStorage.setItem('environment', value);
      
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
      
      // Update profile directly - this is our source of truth
      if (user && user.id) {
        try {
          // First update profiles table - source of truth
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              last_selected_environment: value 
            })
            .eq('id', user.id);
            
          if (profileError) {
            console.error("[ProfilePreferences] Error updating profile environment:", profileError);
          } else if (DEBUG_ENV) {
            console.log("[ProfilePreferences] Successfully updated profile environment in database");
          }
          
          // Then sync with onboarding_preferences for consistency
          const { error: prefError } = await supabase
            .from('onboarding_preferences')
            .update({ 
              learning_environment: value 
            })
            .eq('user_id', user.id);
            
          if (prefError) {
            console.error("[ProfilePreferences] Error updating onboarding preferences environment:", prefError);
          } else if (DEBUG_ENV) {
            console.log("[ProfilePreferences] Successfully updated onboarding preferences environment in database");
          }
          
        } catch (error) {
          console.error("[ProfilePreferences] Failed to update environment preference:", error);
        }
      }
    }
  };
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      
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
      
      setIsEditing(false);
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
            <Button onClick={handleEditStart} variant="outline" size="sm" disabled={isLoading || contextLoading}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <Button onClick={handleCancel} variant="outline" size="sm" disabled={isLoading || contextLoading}>
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 my-0 pb-8">
        {contextLoading && <div className="w-full flex justify-center py-4">
            <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
          </div>}
        
        {!contextLoading && <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weekly-focus-goal">Weekly Focus Goal</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  id="weekly-focus-goal" 
                  disabled={!isEditing || isLoading} 
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
                disabled={!isEditing || isLoading} 
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
                disabled={!isEditing || isLoading} 
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
                disabled={!isEditing || isLoading} 
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="sound-preference">Sound Preference</Label>
              <Select 
                disabled={!isEditing || isLoading} 
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
      
      <AnimatePresence>
        {isEditing && hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <CardFooter className="pt-2 pb-4 px-6 flex justify-end">
              <Button onClick={handleSave} disabled={isLoading || contextLoading}>
                {isLoading || contextLoading ? (
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
          </motion.div>
        )}
      </AnimatePresence>
    </Card>;
};

export default ProfilePreferences;
