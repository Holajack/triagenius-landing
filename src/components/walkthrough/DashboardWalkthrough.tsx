
import { useEffect } from 'react';
import { useWalkthrough, WalkthroughStep } from '@/contexts/WalkthroughContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import PageWalkthrough from './PageWalkthrough';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardWalkthrough = () => {
  const { state } = useWalkthrough();
  const { state: onboardingState } = useOnboarding();
  const isMobile = useIsMobile();

  // Define dashboard steps
  const dashboardSteps: WalkthroughStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your Dashboard',
      description: "Let's take a quick tour of your personalized focus dashboard. You can always skip or restart this tutorial later.",
      targetSelector: '[data-walkthrough="dashboard-header"]',
      placement: 'bottom',
    },
    {
      id: 'environment',
      title: 'Your Environment',
      description: `You've selected the ${onboardingState.environment || 'default'} environment. This customizes the look and feel of your experience.`,
      targetSelector: '[data-walkthrough="environment-badge"]',
      placement: 'bottom',
    },
    {
      id: 'quick-start',
      title: 'Start a Focus Session',
      description: "When you're ready to focus, use this timer to start a new session. You can customize the duration and track your progress.",
      targetSelector: '[data-walkthrough="quick-start"]',
      placement: isMobile ? 'bottom' : 'left',
    },
    {
      id: 'weekly-tracker',
      title: 'Weekly Progress',
      description: 'Track your focus sessions over time. Switch between different chart types to visualize your data.',
      targetSelector: '[data-walkthrough="weekly-tracker"]',
      placement: 'top',
    },
    {
      id: 'ai-insights',
      title: 'AI-Powered Insights',
      description: 'Get personalized recommendations based on your focus patterns and habits.',
      targetSelector: '[data-walkthrough="ai-insights"]',
      placement: 'top',
    },
    {
      id: 'menu',
      title: 'Additional Options',
      description: 'Click the three dots menu to access more features like Nora AI assistant, Leaderboard, and Profile settings.',
      targetSelector: 'button[aria-label="Menu"]',
      placement: isMobile ? 'bottom' : 'left',
    },
    {
      id: 'navigation',
      title: 'Navigation Menu',
      description: 'Use this navigation bar to move between different sections of the app.',
      targetSelector: '[data-walkthrough="navigation-bar"]',
      placement: 'top',
    },
    {
      id: 'nav-home',
      title: 'Home Button',
      description: 'Return to this dashboard anytime by clicking the Home button.',
      targetSelector: '[data-walkthrough="navigation-bar"] button:nth-child(1)',
      placement: 'top',
    },
    {
      id: 'nav-community',
      title: 'Community Features',
      description: 'Connect with other users, join study rooms, and chat with the community.',
      targetSelector: '[data-walkthrough="navigation-bar"] button:nth-child(2)',
      placement: 'top',
    },
    {
      id: 'nav-bonuses',
      title: 'Bonuses Section',
      description: 'Access premium features like study technique quizzes, brain mapping visualizations, and other tools to enhance your learning experience.',
      targetSelector: '[data-walkthrough="navigation-bar"] button:nth-child(3)',
      placement: 'top',
    },
    {
      id: 'nav-results',
      title: 'View Your Results',
      description: 'See detailed analytics about your focus sessions and progress over time.',
      targetSelector: '[data-walkthrough="navigation-bar"] button:nth-child(4)',
      placement: 'top',
    },
    {
      id: 'complete',
      title: "You're All Set!",
      description: 'You can now start using the app. If you need help, look for this button to restart the tutorial.',
      targetSelector: '[data-walkthrough="help-button"]',
      placement: isMobile ? 'top' : 'left',
    },
  ];

  return <PageWalkthrough pageName="dashboard" steps={dashboardSteps} />;
};

export default DashboardWalkthrough;
