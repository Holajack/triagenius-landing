
import { useIsMobile } from '@/hooks/use-mobile';
import PageWalkthrough from './PageWalkthrough';

const FocusSessionWalkthrough = () => {
  const isMobile = useIsMobile();
  
  const focusSessionSteps = [
    {
      id: 'focus-welcome',
      title: 'Focus Session',
      description: "This is your focus session page. Let's learn how to use it effectively.",
      targetSelector: '[data-walkthrough="focus-header"]',
      placement: 'bottom' as const,
    },
    {
      id: 'timer',
      title: 'Focus Timer',
      description: "This timer tracks your current focus session. You can pause or end the session at any time.",
      targetSelector: '[data-walkthrough="focus-timer"]',
      placement: 'bottom' as const,
    },
    {
      id: 'goals',
      title: 'Session Goals',
      description: "Review your current goals for this session.",
      targetSelector: '[data-walkthrough="session-goals"]',
      placement: isMobile ? 'bottom' as const : 'left' as const,
    },
    {
      id: 'end-session',
      title: 'End Session',
      description: "When you're done, click here to end your focus session and review your progress.",
      targetSelector: '[data-walkthrough="end-session"]',
      placement: 'top' as const,
    },
    {
      id: 'navigation',
      title: 'Navigation',
      description: "The navigation bar is still available if you need to switch to another section.",
      targetSelector: '[data-walkthrough="navigation-bar"]',
      placement: 'top' as const,
    }
  ];

  return <PageWalkthrough pagePath="/focus-session" steps={focusSessionSteps} />;
};

export default FocusSessionWalkthrough;
