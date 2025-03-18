
import { useIsMobile } from '@/hooks/use-mobile';
import PageWalkthrough from './PageWalkthrough';
import { WalkthroughStep } from '@/contexts/WalkthroughContext';

const FocusSessionWalkthrough = () => {
  const isMobile = useIsMobile();

  const focusSessionSteps: WalkthroughStep[] = [
    {
      id: 'focus-welcome',
      title: 'Focus Session',
      description: "This is where you'll track your focused work time and break intervals.",
      targetSelector: '[data-walkthrough="focus-header"]',
      placement: 'bottom',
    },
    {
      id: 'focus-timer',
      title: 'Timer Controls',
      description: "Use these controls to start, pause, and reset your focus timer.",
      targetSelector: '[data-walkthrough="focus-timer"]',
      placement: isMobile ? 'bottom' : 'left',
    },
    {
      id: 'session-goals',
      title: 'Session Goals',
      description: "Set and track goals for your current focus session here.",
      targetSelector: '[data-walkthrough="session-goals"]',
      placement: 'top',
    },
    {
      id: 'power-mode',
      title: 'Low Power Mode',
      description: "Enable low power mode to reduce battery usage during long sessions.",
      targetSelector: '[data-walkthrough="power-mode"]',
      placement: isMobile ? 'bottom' : 'right',
    },
  ];

  return <PageWalkthrough pageName="focus-session" steps={focusSessionSteps} />;
};

export default FocusSessionWalkthrough;
