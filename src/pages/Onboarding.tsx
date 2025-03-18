
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useTheme } from "@/contexts/ThemeContext";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Step Components
import { UserGoalStep } from "@/components/onboarding/steps/UserGoalStep";
import { WorkStyleStep } from "@/components/onboarding/steps/WorkStyleStep";
import { EnvironmentStep } from "@/components/onboarding/steps/EnvironmentStep";
import { SoundStep } from "@/components/onboarding/steps/SoundStep";
import { SummaryStep } from "@/components/onboarding/steps/SummaryStep";

// Layout Components
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import CompletedOnboarding from "@/components/onboarding/CompletedOnboarding";

const Onboarding = () => {
  const { state, dispatch, saveOnboardingState } = useOnboarding();
  const { setEnvironmentTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState<{ email: string; username: string } | null>(null);
  const [isPwa, setIsPwa] = useState(false);

  // Define all steps
  const steps = [
    { component: UserGoalStep, title: "What's your main goal?" },
    { component: WorkStyleStep, title: "How do you prefer to work?" },
    { component: EnvironmentStep, title: "Choose your environment" },
    { component: SoundStep, title: "Select your sound preference" },
    { component: SummaryStep, title: "Your personalized setup" },
  ];

  // Check for PWA mode
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    setIsPwa(isStandalone);
  }, []);

  // Check authentication and reset onboarding state when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        // Redirect unauthenticated users to auth page with information about source
        navigate('/auth', { 
          state: { 
            mode: 'signup',
            source: 'onboarding'
          } 
        });
        return;
      }
      
      // Get user details
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, email')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setUserData({
            email: profileData.email || user.email || '',
            username: profileData.username || user.email?.split('@')[0] || 'User',
          });
        }
      }
      
      dispatch({ type: 'RESET_ONBOARDING' });
    };
    
    checkAuth();
  }, [dispatch, navigate]);

  // Update environment theme when environment changes
  useEffect(() => {
    if (state.environment) {
      setEnvironmentTheme(state.environment);
    }
  }, [state.environment, setEnvironmentTheme]);

  const handleNext = async () => {
    if (state.step < steps.length - 1) {
      dispatch({ type: 'SET_STEP', payload: state.step + 1 });
    } else {
      dispatch({ type: 'COMPLETE_ONBOARDING' });
      
      // Save onboarding state to Supabase
      await saveOnboardingState();
      
      // Show success toast when onboarding is complete
      toast.success("Welcome to The Triage System!", {
        description: "Your personalized focus experience is ready.",
        icon: <CheckCircle2 className="text-green-500" />,
      });
      
      // Navigate to the dashboard after completion
      if (isPwa) {
        setTimeout(() => navigate('/dashboard'), 300);
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleBack = () => {
    if (state.step > 0) {
      dispatch({ type: 'SET_STEP', payload: state.step - 1 });
    } else {
      navigate('/');
    }
  };

  const canProceed = () => {
    switch (state.step) {
      case 0: return !!state.userGoal;
      case 1: return !!state.workStyle;
      case 2: return !!state.environment;
      case 3: return !!state.soundPreference;
      default: return true;
    }
  };

  if (state.isComplete) {
    return <CompletedOnboarding />;
  }

  const CurrentStep = steps[state.step].component;
  
  return (
    <OnboardingLayout
      title={steps[state.step].title}
      currentStep={state.step}
      totalSteps={steps.length}
      canProceed={canProceed()}
      onNext={handleNext}
      onBack={handleBack}
      userData={userData}
    >
      <CurrentStep />
    </OnboardingLayout>
  );
};

export default Onboarding;
