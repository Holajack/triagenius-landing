
import { useIsMobile } from '@/hooks/use-mobile';
import PageWalkthrough from './PageWalkthrough';

const ReportsWalkthrough = () => {
  const isMobile = useIsMobile();
  
  const reportsSteps = [
    {
      id: 'reports-welcome',
      title: 'Reports & Analytics',
      description: "Welcome to your Reports page. Here you can see detailed statistics about your focus sessions.",
      targetSelector: '[data-walkthrough="reports-header"]',
      placement: 'bottom' as const,
    },
    {
      id: 'session-list',
      title: 'Session History',
      description: "Browse through your past focus sessions and click on any to see detailed information.",
      targetSelector: '[data-walkthrough="session-list"]',
      placement: 'top' as const,
    },
    {
      id: 'focus-breakdown',
      title: 'Focus Breakdown',
      description: "See how your focus time is distributed across different activities and subjects.",
      targetSelector: '[data-walkthrough="focus-breakdown"]',
      placement: isMobile ? 'bottom' as const : 'right' as const,
    },
    {
      id: 'cognitive-metrics',
      title: 'Cognitive Metrics',
      description: "Track your mental performance and how it changes over time.",
      targetSelector: '[data-walkthrough="cognitive-metrics"]',
      placement: 'top' as const,
    },
    {
      id: 'navigation',
      title: 'Navigation',
      description: "Use the navigation bar to return to other sections of the app.",
      targetSelector: '[data-walkthrough="navigation-bar"]',
      placement: 'top' as const,
    }
  ];

  return <PageWalkthrough pagePath="/reports" steps={reportsSteps} />;
};

export default ReportsWalkthrough;
