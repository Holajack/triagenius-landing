
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EnvironmentManagerProps {
  pendingEnvironment: string | null;
  setPendingEnvironment: (env: string | null) => void;
  onSaveSuccess: () => void;
  onSaveError: (error: string) => void;
}

export const useEnvironmentManager = () => {
  const [pendingEnvironment, setPendingEnvironment] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPreviewedOnly, setHasPreviewedOnly] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { environmentTheme, setEnvironmentTheme, shouldApplyEnvironmentTheming } = useTheme();
  const { state, forceEnvironmentSync } = useOnboarding();
  const { user, refreshUser } = useUser();

  // Preview an environment without saving it
  const previewEnvironment = useCallback((env: string) => {
    if (!env) return;
    
    setPendingEnvironment(env);
    setHasPreviewedOnly(true);
    
    // Only update DOM visuals if on a themed route
    if (shouldApplyEnvironmentTheming()) {
      document.documentElement.classList.remove(
        'theme-office', 
        'theme-park', 
        'theme-home', 
        'theme-coffee-shop', 
        'theme-library'
      );
      document.documentElement.classList.add(`theme-${env}`);
      document.documentElement.setAttribute('data-environment', env);
    }
  }, [shouldApplyEnvironmentTheming]);
  
  // Reset any previewed environments
  const resetPreview = useCallback(() => {
    if (hasPreviewedOnly && environmentTheme) {
      if (shouldApplyEnvironmentTheming()) {
        document.documentElement.classList.remove(
          'theme-office', 
          'theme-park', 
          'theme-home', 
          'theme-coffee-shop', 
          'theme-library'
        );
        document.documentElement.classList.add(`theme-${environmentTheme}`);
        document.documentElement.setAttribute('data-environment', environmentTheme);
      }
    }
    setPendingEnvironment(null);
    setHasPreviewedOnly(false);
  }, [environmentTheme, hasPreviewedOnly, shouldApplyEnvironmentTheming]);

  // Save environment to database and update all relevant locations
  const saveEnvironment = useCallback(async (environment: string): Promise<boolean> => {
    if (!user?.id) {
      setErrorMessage("Cannot save without user ID");
      return false;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      
      console.log(`[EnvironmentManager] Saving environment to database: ${environment}`);
      
      // Update database (primary source of truth)
      // Step 1: Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ last_selected_environment: environment })
        .eq('id', user.id);
        
      if (profileError) {
        console.error("[EnvironmentManager] Error updating profile:", profileError);
        setErrorMessage(`Database error (profile): ${profileError.message}`);
        return false;
      }
      
      // Step 2: Update onboarding preferences table
      const { error: prefError } = await supabase
        .from('onboarding_preferences')
        .update({ learning_environment: environment })
        .eq('user_id', user.id);
        
      if (prefError) {
        console.error("[EnvironmentManager] Error updating onboarding preferences:", prefError);
        setErrorMessage(`Database error (onboarding): ${prefError.message}`);
        return false;
      }
      
      // Database updates successful, update client-side state
      
      // Step 3: Update localStorage (before contexts to ensure contexts read latest value)
      localStorage.setItem('environment', environment);
      
      // Update userPreferences in localStorage for caching
      try {
        const userPrefs = localStorage.getItem('userPreferences');
        if (userPrefs) {
          const parsedPrefs = JSON.parse(userPrefs);
          parsedPrefs.environment = environment;
          localStorage.setItem('userPreferences', JSON.stringify(parsedPrefs));
        }
      } catch (e) {
        console.warn("[EnvironmentManager] Error updating userPreferences in localStorage:", e);
        // Non-critical failure, continue
      }
      
      // Step 4: Update ThemeContext (applies visual changes on themed routes)
      setEnvironmentTheme(environment);
      
      // Step 5: Update OnboardingContext (last step in context updates)
      await forceEnvironmentSync();
      
      // Step 6: Refresh user data
      await refreshUser();
      
      // Step 7: Signal environment changed to other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'environment',
        newValue: environment
      }));
      
      // Also dispatch a custom event 
      const event = new CustomEvent('environment-changed', { 
        detail: { environment } 
      });
      document.dispatchEvent(event);
      
      // Success
      setHasPreviewedOnly(false);
      setPendingEnvironment(null);
      return true;
      
    } catch (error) {
      console.error("[EnvironmentManager] Error saving environment:", error);
      setErrorMessage(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, setEnvironmentTheme, forceEnvironmentSync, refreshUser]);

  return {
    pendingEnvironment,
    setPendingEnvironment,
    previewEnvironment,
    resetPreview,
    saveEnvironment,
    isSaving,
    errorMessage,
    setErrorMessage
  };
};

// This component handles environment change in a more controlled way
export const EnvironmentManager: React.FC<EnvironmentManagerProps> = ({
  pendingEnvironment,
  setPendingEnvironment,
  onSaveSuccess,
  onSaveError
}) => {
  const { saveEnvironment, isSaving, errorMessage } = useEnvironmentManager();
  
  useEffect(() => {
    // Attempt to save when there's a pendingEnvironment
    const savePendingEnvironment = async () => {
      if (pendingEnvironment) {
        const success = await saveEnvironment(pendingEnvironment);
        if (success) {
          onSaveSuccess();
        } else {
          onSaveError(errorMessage || "Unknown error saving environment");
        }
      }
    };
    
    savePendingEnvironment();
  }, [pendingEnvironment, saveEnvironment, onSaveSuccess, onSaveError, errorMessage]);
  
  return null; // This is a logic-only component, no UI
};

export default EnvironmentManager;
