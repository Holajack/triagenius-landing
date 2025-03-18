
import { useIsMobile } from '@/hooks/use-mobile';
import PageWalkthrough from './PageWalkthrough';
import { WalkthroughStep } from '@/contexts/WalkthroughContext';

const ReportsWalkthrough = () => {
  const isMobile = useIsMobile();

  const reportsSteps: WalkthroughStep[] = [
    {
      id: 'reports-welcome',
      title: 'Progress Reports',
      description: "Track your focus history and analyze your productivity patterns over time.",
      targetSelector: '[data-walkthrough="reports-header"]',
      placement: 'bottom',
    },
    {
      id: 'metrics-overview',
      title: 'Focus Metrics',
      description: "View detailed metrics about your focus sessions and cognitive performance.",
      targetSelector: '[data-walkthrough="focus-metrics"]',
      placement: isMobile ? 'bottom' : 'right',
    },
    {
      id: 'session-list',
      title: 'Session History',
      description: "Browse through your past focus sessions and view detailed reports.",
      targetSelector: '[data-walkthrough="session-list"]',
      placement: 'top',
    },
    {
      id: 'navigation',
      title: 'Navigation',
      description: "Access other sections of the app using the navigation bar at the bottom.",
      targetSelector: '[data-walkthrough="navigation-bar"]',
      placement: 'top',
    },
  ];

  return <PageWalkthrough pageName="reports" steps={reportsSteps} />;
};

export default ReportsWalkthrough;
