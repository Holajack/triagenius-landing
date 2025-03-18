
import { useIsMobile } from '@/hooks/use-mobile';
import PageWalkthrough from './PageWalkthrough';
import { WalkthroughStep } from '@/contexts/WalkthroughContext';

const BonusesWalkthrough = () => {
  const isMobile = useIsMobile();

  const bonusesSteps: WalkthroughStep[] = [
    {
      id: 'bonuses-welcome',
      title: 'Bonuses',
      description: "Explore additional learning resources and special features to enhance your focus journey.",
      targetSelector: '[data-walkthrough="bonuses-header"]',
      placement: 'bottom',
    },
    {
      id: 'learning-quiz',
      title: 'Learning Style Quiz',
      description: "Take this quiz to discover your learning style and get personalized recommendations.",
      targetSelector: '[data-walkthrough="learning-quiz"]',
      placement: isMobile ? 'bottom' : 'right',
    },
    {
      id: 'brain-mapping',
      title: 'Brain Visualization',
      description: "See a visualization of how your learning patterns map to different brain regions.",
      targetSelector: '[data-walkthrough="brain-mapping"]',
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

  return <PageWalkthrough pageName="bonuses" steps={bonusesSteps} />;
};

export default BonusesWalkthrough;
