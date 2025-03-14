
import { useEffect } from 'react';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';
import WalkthroughStep from './WalkthroughStep';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

const DashboardWalkthrough = () => {
  const { state, dispatch } = useWalkthrough();
  const { state: onboardingState } = useOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    // Only start the walkthrough if onboarding is complete and user hasn't done the tutorial
    if (onboardingState.isComplete && !state.isActive && !state.hasCompletedTutorial) {
      // Set timeout to allow dashboard to fully render
      const timer = setTimeout(() => {
        startWalkthrough();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [onboardingState.isComplete, state.isActive, state.hasCompletedTutorial]);

  const startWalkthrough = () => {
    const dashboardSteps = [
      {
        id: 'welcome',
        title: 'Welcome to Your Dashboard',
        description: "Let's take a quick tour of your personalized focus dashboard. You can always skip or restart this tutorial later.",
        targetSelector: '[data-walkthrough="dashboard-header"]',
        placement: 'bottom' as const,
      },
      {
        id: 'environment',
        title: 'Your Environment',
        description: `You've selected the ${onboardingState.environment || 'default'} environment. This customizes the look and feel of your experience.`,
        targetSelector: '[data-walkthrough="environment-badge"]',
        placement: 'bottom' as const,
      },
      {
        id: 'quick-start',
        title: 'Start a Focus Session',
        description: "When you're ready to focus, use this timer to start a new session. You can customize the duration and track your progress.",
        targetSelector: '[data-walkthrough="quick-start"]',
        placement: 'left' as const,
      },
      {
        id: 'weekly-tracker',
        title: 'Weekly Progress',
        description: 'Track your focus sessions over time. Switch between different chart types to visualize your data.',
        targetSelector: '[data-walkthrough="weekly-tracker"]',
        placement: 'bottom' as const,
      },
      {
        id: 'ai-insights',
        title: 'AI-Powered Insights',
        description: 'Get personalized recommendations based on your focus patterns and habits.',
        targetSelector: '[data-walkthrough="ai-insights"]',
        placement: 'top' as const,
      },
      {
        id: 'navigation',
        title: 'Navigation',
        description: 'Use this menu to access different sections of the app, including your profile and community features.',
        targetSelector: '[data-walkthrough="navigation-bar"]',
        placement: 'top' as const,
      },
      {
        id: 'complete',
        title: "You're All Set!",
        description: 'You can now start using the app. If you need help, look for this button to restart the tutorial.',
        targetSelector: '[data-walkthrough="help-button"]',
        placement: 'left' as const,
      },
    ];
    
    dispatch({ type: 'START_WALKTHROUGH', payload: dashboardSteps });
  };

  return (
    <>
      <WalkthroughStep />
      
      {/* Help button to restart the tutorial */}
      {!state.isActive && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 rounded-full z-30 bg-white shadow-md border-triage-purple/20"
          onClick={startWalkthrough}
          data-walkthrough="help-button"
        >
          <Info className="h-5 w-5 text-triage-purple" />
        </Button>
      )}
    </>
  );
};

export default DashboardWalkthrough;
