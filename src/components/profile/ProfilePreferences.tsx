
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { toast } from "sonner";
import { UserGoal, WorkStyle, StudyEnvironment, SoundPreference } from "@/types/onboarding";
import { PencilIcon, SaveIcon, Loader2Icon, AlertCircleIcon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "@/hooks/use-user";
import { useLocation, useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnvironmentSelector } from "./EnvironmentSelector";
import { useEnvironmentManager } from "./EnvironmentManager";
import { saveEnvironmentToDatabase, applyEnvironmentLocally } from "@/services/environmentServices";

// Enable this for debugging environment issues
const DEBUG_ENV = true;

const ProfilePreferences = () => {
  const {
    state,
    dispatch,
    saveOnboardingState,
    isLoading: contextLoading,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    forceEnvironmentSync
  } = useOnboarding();
  
  const { user, refreshUser } = useUser();
  const { setEnvironmentTheme, environmentTheme, verifyEnvironmentWithDatabase, shouldApplyEnvironmentTheming } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedState, setEditedState] = useState({
    ...state
  });
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Environment management
  const {
    pendingEnvironment,
    setPendingEnvironment,
    previewEnvironment,
    resetPreview,
    saveEnvironment,
    isSaving
  } = useEnvironmentManager();
  
  // Track if we're on the landing page to avoid applying environment there
  const isLandingPage = location.pathname === "/" || location.pathname === "/index";
  
  useEffect(() => {
    if (user?.profile?.last_selected_environment) {
      if (DEBUG_ENV) console.log(`[ProfilePreferences] Initial database environment: ${user.profile.last_selected_environment}`);
    }
  }, [user?.profile?.last_selected_environment]);
  
  const handleEditStart = () => {
    setIsEditing(true);
    setEditedState({
      ...state
    });
    setErrorMessage(null);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setEditedState({
      ...state
    });
    
    if (pendingEnvironment) {
      resetPreview();
    }
    
    setErrorMessage(null);
  };
  
  const handleChange = async (key: string, value: any) => {
    setEditedState(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
    
    if (key === 'environment' && value) {
      if (DEBUG_ENV) console.log(`[ProfilePreferences] Environment change requested: ${value}`);
      
      // Just preview the environment, don't save yet
      previewEnvironment(value);
    }
  };
  
  const savePreferencesOnExit = useCallback(async () => {
    if (hasUnsavedChanges && isEditing && autoSaveEnabled) {
      if (DEBUG_ENV) console.log("[ProfilePreferences] Auto-saving preferences before exit");
      await handleSave();
      return true;
    }
    
    return false;
  }, [hasUnsavedChanges, isEditing, autoSaveEnabled]);
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      savePreferencesOnExit();
    };
  }, [hasUnsavedChanges, savePreferencesOnExit]);
  
  useEffect(() => {
    const handleHashChange = async () => {
      if (location.hash !== "#preferences" && hasUnsavedChanges && isEditing) {
        await savePreferencesOnExit();
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [location.hash, hasUnsavedChanges, isEditing, savePreferencesOnExit]);
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Step 1: Handle environment change first if needed
      if (pendingEnvironment && user?.id) {
        if (DEBUG_ENV) console.log(`[ProfilePreferences] Saving environment change: ${pendingEnvironment}`);
        
        const result = await saveEnvironment(pendingEnvironment);
        
        if (!result) {
          toast.error("Failed to save environment. Please try again.");
          setIsLoading(false);
          return;
        }
      }
      
      // Step 2: Update state in OnboardingContext
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

      // Step 3: Save OnboardingContext state to database
      await saveOnboardingState();
      
      // Step 4: Refresh user data to ensure everything is in sync
      await refreshUser();
      
      // Reset UI state
      setIsEditing(false);
      setHasUnsavedChanges(false);
      
      // Show success message
      toast.success("Preferences saved successfully");
    } catch (error) {
      console.error("[ProfilePreferences] Error updating preferences:", error);
      setErrorMessage(`Error updating preferences: ${error instanceof Error ? error.message : String(error)}`);
      toast.error("Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="my-0 py-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Preferences</CardTitle>
          {!isEditing ? (
            <Button 
              onClick={handleEditStart} 
              variant="outline" 
              size="sm" 
              disabled={isLoading || contextLoading || isSaving}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button 
                onClick={handleCancel} 
                variant="outline" 
                size="sm" 
                disabled={isLoading || contextLoading || isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                size="sm" 
                disabled={isLoading || contextLoading || isSaving || !hasUnsavedChanges}
              >
                {isLoading || isSaving ? (
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
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 my-0 pb-8">
        {(contextLoading || isSaving) && (
          <div className="flex items-center justify-center py-4">
            <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-start space-x-2">
            <AlertCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error saving preferences</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        )}
        
        {!contextLoading && !isSaving && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userGoal">Primary Learning Goal</Label>
                <Select 
                  value={editedState.userGoal || ''} 
                  onValueChange={(value) => handleChange('userGoal', value)}
                  disabled={!isEditing || isLoading}
                >
                  <SelectTrigger id="userGoal">
                    <SelectValue placeholder="Select a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic Excellence</SelectItem>
                    <SelectItem value="career">Career Development</SelectItem>
                    <SelectItem value="personal">Personal Growth</SelectItem>
                    <SelectItem value="test-prep">Test Preparation</SelectItem>
                    <SelectItem value="creative">Creative Skills</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workStyle">Work Style</Label>
                <Select 
                  value={editedState.workStyle || ''} 
                  onValueChange={(value) => handleChange('workStyle', value)}
                  disabled={!isEditing || isLoading}
                >
                  <SelectTrigger id="workStyle">
                    <SelectValue placeholder="Select a work style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="focused">Deep Focus (Longer Sessions)</SelectItem>
                    <SelectItem value="balanced">Balanced (Medium Sessions)</SelectItem>
                    <SelectItem value="flexible">Flexible (Shorter Sessions)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <EnvironmentSelector
                value={editedState.environment || 'office'}
                onChange={(value) => handleChange('environment', value)}
                disabled={!isEditing || isLoading}
                showPreview={!isLandingPage}
              />

              <div className="space-y-2">
                <Label htmlFor="soundPreference">Sound Environment</Label>
                <Select 
                  value={editedState.soundPreference || ''} 
                  onValueChange={(value) => handleChange('soundPreference', value)}
                  disabled={!isEditing || isLoading}
                >
                  <SelectTrigger id="soundPreference">
                    <SelectValue placeholder="Select sound preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Silent</SelectItem>
                    <SelectItem value="white-noise">White Noise</SelectItem>
                    <SelectItem value="nature">Nature Sounds</SelectItem>
                    <SelectItem value="lofi">Lo-Fi Music</SelectItem>
                    <SelectItem value="classical">Classical Music</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label htmlFor="weeklyGoal">Weekly Focus Goal (hours)</Label>
                  <span className="text-sm font-medium">
                    {editedState.weeklyFocusGoal || 10} hours
                  </span>
                </div>
                <Slider
                  id="weeklyGoal"
                  value={[editedState.weeklyFocusGoal || 10]} 
                  min={1}
                  max={40}
                  step={1}
                  onValueChange={(values) => handleChange('weeklyFocusGoal', values[0])}
                  disabled={!isEditing || isLoading}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1h</span>
                  <span>10h</span>
                  <span>20h</span>
                  <span>30h</span>
                  <span>40h</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {isEditing && (
        <CardFooter className="pt-0 border-t px-6 py-4">
          <div className="w-full flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isLoading || contextLoading || isSaving || !hasUnsavedChanges}
            >
              {isLoading || isSaving ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default ProfilePreferences;
