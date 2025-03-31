
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Enable this for debugging environment issues
const DEBUG_ENV = true;

/**
 * Updates the environment in the database (both tables) and returns success status
 */
export const saveEnvironmentToDatabase = async (
  userId: string, 
  environment: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    if (DEBUG_ENV) console.log(`[environmentServices] Saving environment to DB: ${environment}`);
    
    // Update profile table (primary source of truth)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ last_selected_environment: environment })
      .eq('id', userId);
      
    if (profileError) {
      console.error("[environmentServices] Error updating profile:", profileError);
      return { 
        success: false, 
        error: `Failed to update profile: ${profileError.message}` 
      };
    }
      
    // Update environment in onboarding_preferences table for consistency
    const { error: prefError } = await supabase
      .from('onboarding_preferences')
      .update({ learning_environment: environment })
      .eq('user_id', userId);
      
    if (prefError) {
      console.error("[environmentServices] Error updating onboarding preferences:", prefError);
      // We don't fail completely here since the primary source of truth (profiles) was updated
      toast.warning("Environment was saved but onboarding preferences may be out of sync");
    } else if (DEBUG_ENV) {
      console.log("[environmentServices] Successfully updated both database tables");
    }
    
    return { success: true };
    
  } catch (error) {
    console.error("[environmentServices] Failed to save environment:", error);
    return { 
      success: false, 
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

/**
 * Gets the environment values from all possible sources for comparison
 */
export const getEnvironmentStatus = async (userId: string): Promise<{
  profileDb: string | null;
  onboardingPrefs: string | null;
  localStorage: string | null;
  domAttr: string | null;
  allMatch: boolean;
}> => {
  try {
    // Get values from localStorage and DOM
    const localStorage = window.localStorage.getItem('environment');
    const domAttr = document.documentElement.getAttribute('data-environment');
    
    let profileDb: string | null = null;
    let onboardingPrefs: string | null = null;
    
    if (userId) {
      // Get value from profile table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('last_selected_environment')
        .eq('id', userId)
        .single();
        
      if (!profileError && profileData?.last_selected_environment) {
        profileDb = profileData.last_selected_environment;
      }
      
      // Get value from onboarding_preferences table
      const { data: prefData, error: prefError } = await supabase
        .from('onboarding_preferences')
        .select('learning_environment')
        .eq('user_id', userId)
        .single();
        
      if (!prefError && prefData?.learning_environment) {
        onboardingPrefs = prefData.learning_environment;
      }
    }
    
    // Check if all defined values are the same
    const definedValues = [profileDb, onboardingPrefs, localStorage, domAttr].filter(Boolean);
    const uniqueValues = new Set(definedValues);
    const allMatch = definedValues.length > 0 && uniqueValues.size === 1;
    
    return {
      profileDb,
      onboardingPrefs,
      localStorage,
      domAttr,
      allMatch
    };
    
  } catch (error) {
    console.error("[environmentServices] Error getting environment status:", error);
    return {
      profileDb: null,
      onboardingPrefs: null,
      localStorage: null,
      domAttr: null,
      allMatch: false
    };
  }
};

/**
 * Apply environment to all local UI components
 */
export const applyEnvironmentLocally = (
  environment: string, 
  shouldApplyVisuals: boolean
): void => {
  // Update localStorage
  localStorage.setItem('environment', environment);
  
  // Update DOM classes and attributes (only if on a themed route)
  if (shouldApplyVisuals) {
    document.documentElement.classList.remove(
      'theme-office', 
      'theme-park', 
      'theme-home', 
      'theme-coffee-shop', 
      'theme-library'
    );
    document.documentElement.classList.add(`theme-${environment}`);
    document.documentElement.setAttribute('data-environment', environment);
  }
  
  // Update userPreferences in localStorage
  try {
    const userPrefs = localStorage.getItem('userPreferences');
    if (userPrefs) {
      const parsedPrefs = JSON.parse(userPrefs);
      parsedPrefs.environment = environment;
      localStorage.setItem('userPreferences', JSON.stringify(parsedPrefs));
    }
  } catch (e) {
    console.error("[environmentServices] Error updating userPreferences:", e);
  }
  
  // Dispatch environment change events
  // 1. Storage event for components listening to localStorage
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'environment',
    newValue: environment
  }));
  
  // 2. Custom event for components with specific environment listeners
  const event = new CustomEvent('environment-changed', { 
    detail: { environment } 
  });
  document.dispatchEvent(event);
};
