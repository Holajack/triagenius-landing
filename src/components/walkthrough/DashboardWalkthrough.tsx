
import { useEffect } from 'react';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import PageWalkthrough from './PageWalkthrough';

const DashboardWalkthrough = () => {
  const { state: onboardingState } = useOnboarding();
  const isMobile = useIsMobile();
  
  // Dashboard specific walkthrough steps
  const dashboardSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Your Dashboard',
      description: "Let's take a quick tour of your personalized focus dashboard. You can always restart this tutorial using the help button.",
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
      placement: isMobile ? 'bottom' as const : 'left' as const,
    },
    {
      id: 'weekly-tracker',
      title: 'Weekly Progress',
      description: 'Track your focus sessions over time. Switch between different chart types to visualize your data.',
      targetSelector: '[data-walkthrough="weekly-tracker"]',
      placement: 'top' as const,
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
      title: 'Navigation Menu',
      description: 'Use this navigation bar to move between different sections of the app.',
      targetSelector: '[data-walkthrough="navigation-bar"]',
      placement: 'top' as const,
    },
    {
      id: 'nav-home',
      title: 'Home Button',
      description: 'Return to this dashboard anytime by clicking the Home button.',
      targetSelector: '[data-walkthrough="navigation-bar"] button:nth-child(1)',
      placement: 'top' as const,
    },
    {
      id: 'nav-community',
      title: 'Community Features',
      description: 'Connect with other users, join study rooms, and chat with the community.',
      targetSelector: '[data-walkthrough="navigation-bar"] button:nth-child(2)',
      placement: 'top' as const,
    },
    {
      id: 'nav-bonuses',
      title: 'Bonuses Section',
      description: 'Access premium features like study technique quizzes, brain mapping visualizations, and other tools to enhance your learning experience.',
      targetSelector: '[data-walkthrough="navigation-bar"] button:nth-child(3)',
      placement: 'top' as const,
    },
    {
      id: 'nav-results',
      title: 'View Your Results',
      description: 'See detailed analytics about your focus sessions and progress over time.',
      targetSelector: '[data-walkthrough="navigation-bar"] button:nth-child(4)',
      placement: 'top' as const,
    },
    {
      id: 'menu',
      title: 'Additional Options',
      description: 'Click the menu to access more features like Nora AI assistant, Leaderboard, and Profile settings.',
      targetSelector: 'button[aria-label="Menu"]',
      placement: isMobile ? 'bottom' as const : 'left' as const,
    },
    {
      id: 'complete',
      title: "You're All Set!",
      description: 'You can now start using the app. If you need help, look for the help button to restart the tutorial.',
      targetSelector: '[data-walkthrough="help-button"]',
      placement: isMobile ? 'top' as const : 'left' as const,
    },
  ];

  return <PageWalkthrough pagePath="/dashboard" steps={dashboardSteps} />;
};

export default DashboardWalkthrough;
