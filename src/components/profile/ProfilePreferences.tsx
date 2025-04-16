import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { toast } from "sonner";
import { UserGoal, WorkStyle, StudyEnvironment, SoundPreference } from "@/types/onboarding";
import { PencilIcon, SaveIcon, Loader2Icon, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "@/hooks/use-user";
import { useLocation, useNavigate } from "react-router-dom";
import { useSoundFiles } from "@/hooks/use-sound-files";

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
  const { soundFiles, isLoading: soundFilesLoading, fetchSoundFilesByPreference, getSoundFileUrl } = useSoundFiles();
  const [previewSound, setPreviewSound] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [soundLoading, setSoundLoading] = useState(false);

  // Set up audio player
  useEffect(() => {
    const player = new Audio();
    player.addEventListener('ended', () => {
      setPreviewSound(null);
      setIsPlayingSound(false);
    });
    
    player.addEventListener('error', (e) => {
      console.error("Audio playback error:", e);
      toast.error("Failed to play sound preview");
      setPreviewSound(null);
      setIsPlayingSound(false);
      setSoundLoading(false);
    });
    
    player.addEventListener('loadeddata', () => {
      setSoundLoading(false);
      player.play().catch(err => {
        console.error("Error playing audio:", err);
        setPreviewSound(null);
        setIsPlayingSound(false);
        setSoundLoading(false);
      });
    });
    
    setAudioPlayer(player);
    
    return () => {
      player.pause();
      player.src = '';
      if (previewTimer) {
        clearTimeout(previewTimer);
      }
    };
  }, []);

  // Handle sound preview
  useEffect(() => {
    if (audioPlayer) {
      if (previewSound) {
        audioPlayer.pause();
        setSoundLoading(true);
        audioPlayer.src = previewSound;
        
        // Set a timer to stop after 10 seconds
        const timer = setTimeout(() => {
          audioPlayer.pause();
          setPreviewSound(null);
          setIsPlayingSound(false);
        }, 10000);
        
        setPreviewTimer(timer);
      } else {
        audioPlayer.pause();
        if (previewTimer) {
          clearTimeout(previewTimer);
        }
      }
    }
    
    return () => {
      if (previewTimer) {
        clearTimeout(previewTimer);
      }
    };
  }, [previewSound, audioPlayer]);
  
  useEffect(() => {
    if (user?.profile?.last_selected_environment) {
      setLastSavedEnvironment(user.profile.last_selected_environment);
      if (DEBUG_ENV) console.log(`[ProfilePreferences] Initial database environment: ${user.profile.last_selected_environment}`);
    }
  }, [user?.profile?.last_selected_environment]);
  
  const saveEnvironmentToDatabase = async (envValue: string): Promise<boolean> => {
    if (!user || !user.id) {
      console.error("[ProfilePreferences] Cannot save environment - no user");
      return false;
    }
    
    try {
      setIsSavingEnvironment(true);
      
      if (DEBUG_ENV) console.log(`[ProfilePreferences] Saving environment to DB: ${envValue}`);
      
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
      
      const { error: prefError } = await supabase
        .from('onboarding_preferences')
        .update({ 
          learning_environment: envValue 
        })
        .eq('user_id', user.id);
        
      if (prefError) {
        console.error("[ProfilePreferences] Error updating onboarding preferences environment:", prefError);
      }
      
      localStorage.setItem('environment', envValue);
      
      setLastSavedEnvironment(envValue);
      
      const userPrefs = localStorage.getItem('userPreferences');
      if (userPrefs) {
        try {
          const parsedPrefs = JSON.parse(userPrefs);
          parsedPrefs.environment = envValue;
          localStorage.setItem('userPreferences', JSON.stringify(parsedPrefs));
        } catch (e) {
          console.error("Error updating userPreferences:", e);
        }
      }
      
      await refreshUser();
      
      dispatch({
        type: 'SET_ENVIRONMENT',
        payload: envValue as StudyEnvironment
      });
      
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
    
    // Reset any ongoing sound preview when editing starts
    if (previewSound) {
      setPreviewSound(null);
      setIsPlayingSound(false);
    }
  };
  
  const handleCancel = () => {
    // Stop any sound preview
    if (previewSound) {
      setPreviewSound(null);
      setIsPlayingSound(false);
    }
    
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setEditedState({
      ...state
    });
    
    if (pendingEnvironment) {
      setPendingEnvironment(null);
      
      const envToRestore = state.environment || lastSavedEnvironment || 'office';
      previewEnvironmentVisually(envToRestore);
    }
  };
  
  const previewEnvironmentVisually = (value: string) => {
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
  
  const applyEnvironmentFully = (value: string) => {
    setEnvironmentTheme(value as StudyEnvironment);
    
    document.documentElement.classList.remove(
      'theme-office', 
      'theme-park', 
      'theme-home', 
      'theme-coffee-shop', 
      'theme-library'
    );
    document.documentElement.classList.add(`theme-${value}`);
    document.documentElement.setAttribute('data-environment', value);
    
    const event = new Event('environmentChanged');
    document.dispatchEvent(event);
  };
  
  const handleChange = async (key: string, value: any) => {
    setEditedState(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
    
    if (key === 'environment' && value) {
      if (DEBUG_ENV) console.log(`[ProfilePreferences] Environment change requested: ${value}`);
      
      setPendingEnvironment(value as string);
      
      previewEnvironmentVisually(value);
    }
  };

  // Handle sound preference change
  const handleSoundPreferenceChange = async (value: string) => {
    // Stop any current preview
    if (previewSound) {
      setPreviewSound(null);
      setIsPlayingSound(false);
    }
    
    // Just update the state, don't play sound yet
    handleChange('soundPreference', value as SoundPreference);
  };
  
  const toggleSoundPreview = async () => {
    // If not in editing mode, don't allow sound preview
    if (!isEditing) return;
    
    // If currently playing, stop
    if (isPlayingSound) {
      setPreviewSound(null);
      setIsPlayingSound(false);
      return;
    }
    
    // Otherwise start preview
    if (editedState.soundPreference && editedState.soundPreference !== 'silence') {
      try {
        setSoundLoading(true);
        setIsPlayingSound(true);
        
        // Fetch sounds for the selected category
        const resultFiles = await fetchSoundFilesByPreference(editedState.soundPreference);
        
        // If we have sounds in this category, play the first one
        if (resultFiles && resultFiles.length > 0) {
          const soundUrl = getSoundFileUrl(resultFiles[0].file_path);
          setPreviewSound(soundUrl);
        } else {
          console.log("No sound files found for category:", editedState.soundPreference);
          setSoundLoading(false);
          setIsPlayingSound(false);
          toast.error(`No sound files found for ${editedState.soundPreference}`);
        }
      } catch (error) {
        console.error("Error loading sound preview:", error);
        setSoundLoading(false);
        setIsPlayingSound(false);
        toast.error("Failed to load sound preview");
      }
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
    
    const handleRouteChange = async () => {
      await savePreferencesOnExit();
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
    // First stop any sound preview that might be playing
    if (previewSound) {
      setPreviewSound(null);
      setIsPlayingSound(false);
    }
    
    try {
      setIsLoading(true);
      
      if (pendingEnvironment) {
        const saveSuccess = await saveEnvironmentToDatabase(pendingEnvironment);
        
        if (saveSuccess) {
          applyEnvironmentFully(pendingEnvironment);
          setPendingEnvironment(null);
          
          await forceEnvironmentSync();
        } else {
          toast.error("Failed to save environment preference");
          setIsLoading(false);
          return;
        }
      }
      
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

      await saveOnboardingState();
      
      await refreshUser();
      
      if (user?.id && editedState.environment) {
        const { data, error } = await supabase
          .from('profiles')
          .select('last_selected_environment')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          if (data.last_selected_environment !== editedState.environment) {
            if (DEBUG_ENV) console.log(`[ProfilePreferences] Environment verification failed. DB has ${data.last_selected_environment} but should be ${editedState.environment}`);
            
            await supabase
              .from('profiles')
              .update({ 
                last_selected_environment: editedState.environment 
              })
              .eq('id', user.id);
              
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
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'environment',
        newValue: editedState.environment
      }));
      
      setIsEditing(false);
      setHasUnsavedChanges(false);
      toast.success("Preferences saved successfully");
    } catch (error) {
      console.error("Error updating preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getEnvironmentPreviewStyles = (envValue: string) => {
    switch(envValue) {
      case 'office': 
        return {
          badge: "bg-blue-600 text-white",
          border: "border-blue-300"
        };
      case 'park': 
        return {
          badge: "bg-green-800 text-white",
          border: "border-green-600"
        };
      case 'home': 
        return {
          badge: "bg-orange-500 text-white",
          border: "border-orange-300"
        };
      case 'coffee-shop': 
        return {
          badge: "bg-amber-800 text-white",
          border: "border-amber-700"
        };
      case 'library': 
        return {
          badge: "bg-gray-600 text-white",
          border: "border-gray-300"
        };
      default:
        return {
          badge: "bg-purple-600 text-white",
          border: "border-purple-300"
        };
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
              {isEditing && pendingEnvironment && (
                <div className={`mt-2 p-2 rounded-lg border ${getEnvironmentPreviewStyles(pendingEnvironment).border}`}>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getEnvironmentPreviewStyles(pendingEnvironment).badge}`}>
                    Preview: {pendingEnvironment} theme
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sound-preference">Sound Preference</Label>
              <div className="flex items-center gap-2">
                <Select 
                  disabled={!isEditing || isLoading || isSavingEnvironment} 
                  value={editedState.soundPreference || state.soundPreference || ""} 
                  onValueChange={handleSoundPreferenceChange}
                >
                  <SelectTrigger id="sound-preference" className="flex-1">
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
                {editedState.soundPreference && editedState.soundPreference !== 'silence' && isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSoundPreview}
                    disabled={!isEditing || isLoading || isSavingEnvironment || soundFilesLoading}
                    title={isPlayingSound ? "Stop Preview" : "Preview Sound"}
                  >
                    {soundLoading ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : isPlayingSound ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              {soundFilesLoading && (
                <p className="text-xs text-muted-foreground">Loading sounds...</p>
              )}
              {editedState.soundPreference && isEditing && (
                <p className="text-xs text-muted-foreground mt-1">
                  Click the sound icon to preview {editedState.soundPreference === 'silence' ? 'no sound' : editedState.soundPreference} sounds
                </p>
              )}
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
