import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { toast } from "sonner";
import { UserGoal, WorkStyle, StudyEnvironment, SoundPreference } from "@/types/onboarding";
import { PencilIcon, SaveIcon, Loader2Icon, AlertCircleIcon } from "lucide-react";
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
  const [isSavingEnvironment, setIsSavingEnvironment] = useState(false);
  const [lastSavedEnvironment, setLastSavedEnvironment] = useState<string | null>(null);
  const [pendingEnvironment, setPendingEnvironment] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [saveAttempts, setSaveAttempts] = useState(0);
  const [syncStatus, setSyncStatus] = useState<{
    profileDb: boolean;
    onboardingPrefs: boolean;
    themeContext: boolean;
    localStorage: boolean;
    domAttr: boolean;
  }>({
    profileDb: true,
    onboardingPrefs: true,
    themeContext: true,
    localStorage: true,
    domAttr: true
  });
  
  // Track whether we've shown a toast already for this save attempt
  const [hasShownToast, setHasShownToast] = useState(false);
  
  // Track if we're on the landing page to avoid applying environment there
  const isLandingPage = location.pathname === "/" || location.pathname === "/index";
  
  useEffect(() => {
    if (user?.profile?.last_selected_environment) {
      setLastSavedEnvironment(user.profile.last_selected_environment);
      if (DEBUG_ENV) console.log(`[ProfilePreferences] Initial database environment: ${user.profile.last_selected_environment}`);
    }
  }, [user?.profile?.last_selected_environment]);
  
  const saveEnvironmentToDatabase = async (envValue: string, maxRetries = 2): Promise<boolean> => {
    if (!user || !user.id) {
      console.error("[ProfilePreferences] Cannot save environment - no user");
      return false;
    }
    
    try {
      setIsSavingEnvironment(true);
      
      if (DEBUG_ENV) console.log(`[ProfilePreferences] Saving environment to DB: ${envValue} (attempt ${saveAttempts + 1})`);
      
      // Start with a clean state for each save attempt
      setSyncStatus({
        profileDb: true,
        onboardingPrefs: true,
        themeContext: true,
        localStorage: true,
        domAttr: true
      });
      
      // 1. Save to DATABASE FIRST (both tables in a transaction if possible)
      let updateSuccess = true;
      
      // Update environment in profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          last_selected_environment: envValue 
        })
        .eq('id', user.id);
        
      if (profileError) {
        console.error("[ProfilePreferences] Error updating profile environment:", profileError);
        setSyncStatus(prev => ({ ...prev, profileDb: false }));
        updateSuccess = false;
      } else {
        setSyncStatus(prev => ({ ...prev, profileDb: true }));
      }
      
      // Update environment in onboarding_preferences table
      const { error: prefError } = await supabase
        .from('onboarding_preferences')
        .update({ 
          learning_environment: envValue 
        })
        .eq('user_id', user.id);
        
      if (prefError) {
        console.error("[ProfilePreferences] Error updating onboarding preferences environment:", prefError);
        setSyncStatus(prev => ({ ...prev, onboardingPrefs: false }));
        updateSuccess = false;
      } else {
        setSyncStatus(prev => ({ ...prev, onboardingPrefs: true }));
      }
      
      // Verify successful database update BEFORE proceeding
      if (!updateSuccess) {
        // If we haven't exceeded max retries, try again
        if (saveAttempts < maxRetries) {
          setSaveAttempts(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between retries
          return await saveEnvironmentToDatabase(envValue, maxRetries);
        }
        
        // If we've exceeded retries, report failure
        if (!hasShownToast) {
          toast.error("Failed to save environment to database");
          setHasShownToast(true);
        }
        return false;
      }
      
      // If database update was successful, only then update local state and DOM
      setLastSavedEnvironment(envValue);
      
      // Update localStorage
      localStorage.setItem('environment', envValue);
      
      // Update userPreferences in localStorage
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
      
      // Reset save attempts counter on success
      setSaveAttempts(0);
      
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
    // Reset toast flag when starting to edit
    setHasShownToast(false);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setEditedState({
      ...state
    });
    
    if (pendingEnvironment) {
      setPendingEnvironment(null);
      
      const envToRestore = state.environment || lastSavedEnvironment || 'office';
      if (!isLandingPage) {
        previewEnvironmentVisually(envToRestore);
      }
    }
    
    // Reset sync status
    setSyncStatus({
      profileDb: true,
      onboardingPrefs: true,
      themeContext: true,
      localStorage: true,
      domAttr: true
    });
    
    // Reset toast flag
    setHasShownToast(false);
  };
  
  const previewEnvironmentVisually = (value: string) => {
    if (!shouldApplyEnvironmentTheming()) return;
    
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
  
  const applyEnvironmentFully = async (value: string): Promise<boolean> => {
    try {
      const shouldApplyVisuals = shouldApplyEnvironmentTheming();
      
      if (DEBUG_ENV) console.log(`[ProfilePreferences] Applying environment fully: ${value} (visual changes: ${shouldApplyVisuals})`);
      
      // 1. Update ThemeContext state
      setEnvironmentTheme(value as StudyEnvironment);
      setSyncStatus(prev => ({ ...prev, themeContext: true }));
      
      // 2. Update DOM classes and attributes only if on a themed route
      if (shouldApplyVisuals) {
        document.documentElement.classList.remove(
          'theme-office', 
          'theme-park', 
          'theme-home', 
          'theme-coffee-shop', 
          'theme-library'
        );
        document.documentElement.classList.add(`theme-${value}`);
        document.documentElement.setAttribute('data-environment', value);
        setSyncStatus(prev => ({ ...prev, domAttr: true }));
      } else {
        // Skip DOM checks if not on themed route
        setSyncStatus(prev => ({ ...prev, domAttr: true }));
      }
      
      // 3. Update localStorage
      localStorage.setItem('environment', value);
      setSyncStatus(prev => ({ ...prev, localStorage: true }));
      
      // 4. Dispatch custom event for any other listeners
      const event = new CustomEvent('environment-changed', { 
        detail: { environment: value } 
      });
      document.dispatchEvent(event);
      
      // 5. Force sync with OnboardingContext
      await forceEnvironmentSync();
      
      // 6. Verify everything is in sync
      const verifyResult = await verifyEnvironmentSync(value);
      
      return verifyResult;
    } catch (error) {
      console.error("[ProfilePreferences] Error in applyEnvironmentFully:", error);
      return false;
    }
  };
  
  const verifyEnvironmentSync = async (expectedValue: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      // Check ThemeContext
      const themeContextMatch = environmentTheme === expectedValue;
      setSyncStatus(prev => ({ ...prev, themeContext: themeContextMatch }));
      
      // Check DOM attribute (only if on themed route)
      let domAttrMatch = true;
      
      if (shouldApplyEnvironmentTheming()) {
        const domAttr = document.documentElement.getAttribute('data-environment');
        domAttrMatch = domAttr === expectedValue;
        setSyncStatus(prev => ({ ...prev, domAttr: domAttrMatch }));
      } else {
        // Skip DOM check on non-themed routes
        setSyncStatus(prev => ({ ...prev, domAttr: true }));
      }
      
      // Check localStorage
      const localStorageValue = localStorage.getItem('environment');
      const localStorageMatch = localStorageValue === expectedValue;
      setSyncStatus(prev => ({ ...prev, localStorage: localStorageMatch }));
      
      // Check profile DB
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('last_selected_environment')
        .eq('id', user.id)
        .single();
        
      const profileDbMatch = !profileError && profileData?.last_selected_environment === expectedValue;
      setSyncStatus(prev => ({ ...prev, profileDb: profileDbMatch }));
      
      // Check onboarding preferences
      const { data: prefData, error: prefError } = await supabase
        .from('onboarding_preferences')
        .select('learning_environment')
        .eq('user_id', user.id)
        .single();
        
      const onboardingPrefsMatch = !prefError && prefData?.learning_environment === expectedValue;
      setSyncStatus(prev => ({ ...prev, onboardingPrefs: onboardingPrefsMatch }));
      
      const allInSync = themeContextMatch && 
                      (shouldApplyEnvironmentTheming() ? domAttrMatch : true) && // Skip DOM check on non-themed routes
                      localStorageMatch && 
                      profileDbMatch && 
                      onboardingPrefsMatch;
                      
      if (DEBUG_ENV) {
        console.log("[ProfilePreferences] Environment Sync Verification:", {
          expectedValue,
          themeContext: { value: environmentTheme, match: themeContextMatch },
          dom: { value: document.documentElement.getAttribute('data-environment'), match: domAttrMatch },
          localStorage: { value: localStorageValue, match: localStorageMatch },
          profileDb: { value: profileData?.last_selected_environment, match: profileDbMatch },
          onboardingPrefs: { value: prefData?.learning_environment, match: onboardingPrefsMatch },
          allInSync,
          shouldTheme: shouldApplyEnvironmentTheming()
        });
      }
      
      return allInSync;
    } catch (error) {
      console.error("[ProfilePreferences] Error in verifyEnvironmentSync:", error);
      return false;
    }
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
      
      // Just preview visually but don't apply fully yet
      if (!isLandingPage) {
        previewEnvironmentVisually(value);
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
    try {
      // Reset toast flag at the beginning of each save attempt
      setHasShownToast(false);
      setIsLoading(true);
      
      // Step 1: First handle environment change if needed
      if (pendingEnvironment) {
        if (DEBUG_ENV) console.log(`[ProfilePreferences] Saving environment change: ${pendingEnvironment}`);
        
        // First save to database (most critical)
        const dbSaveSuccess = await saveEnvironmentToDatabase(pendingEnvironment);
        
        if (!dbSaveSuccess) {
          if (!hasShownToast) {
            toast.error("Failed to save environment to database. Please try again.");
            setHasShownToast(true);
          }
          setIsLoading(false);
          return;
        }
        
        // Then apply environment to all other locations
        const appliedSuccessfully = await applyEnvironmentFully(pendingEnvironment);
        
        if (!appliedSuccessfully) {
          if (!hasShownToast) {
            toast.warning("Environment settings saved to database but some visual elements might need a page refresh.");
            setHasShownToast(true);
          }
        } else {
          // Success case - environment saved and applied
          setPendingEnvironment(null);
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
      
      // Step 4: Refresh user data
      await refreshUser();
      
      // Step 5: Dispatch storage event for any components listening to localStorage
      // Skip for landing page
      if (!isLandingPage && editedState.environment) {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'environment',
          newValue: editedState.environment
        }));
      }
      
      // Final verification for environment
      if (editedState.environment && pendingEnvironment) {
        const finalVerify = await verifyEnvironmentSync(editedState.environment);
        
        if (!finalVerify && !hasShownToast) {
          console.warn("[ProfilePreferences] Final environment sync verification failed");
          // Don't show additional warning if we've already shown a success toast
        }
      }
      
      // Reset UI state
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setSaveAttempts(0);
      
      // Show success message - but only if we haven't shown another toast already
      if (!hasShownToast) {
        toast.success("Preferences saved successfully");
        setHasShownToast(true);
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      if (!hasShownToast) {
        toast.error("Failed to save preferences");
        setHasShownToast(true);
      }
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
              
              {pendingEnvironment && (
                <div className={`mt-2 p-2 rounded-lg border ${getEnvironmentPreviewStyles(pendingEnvironment).border}`}>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getEnvironmentPreviewStyles(pendingEnvironment).badge}`}>
                    Preview: {pendingEnvironment} theme
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click Save Changes to apply this environment
                  </p>
                </div>
              )}
              
              {!syncStatus.profileDb || !syncStatus.onboardingPrefs ? (
                <div className="mt-2 p-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800">
                  <div className="flex items-center">
                    <AlertCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="text-xs font-medium">Sync Warning</span>
                  </div>
                  <p className="text-xs mt-1">
                    {!syncStatus.profileDb && "Profile database out of sync. "}
                    {!syncStatus.onboardingPrefs && "Onboarding preferences out of sync. "}
                    Changes will be re-synchronized when you save.
                  </p>
                </div>
              ) : null}
              
              {DEBUG_ENV && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Status: {lastSavedEnvironment || environmentTheme || state.environment || "unknown"}
                  {isSavingEnvironment ? ' (saving...)' : ''}
                </div>
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
