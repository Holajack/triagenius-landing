
import { useIsMobile } from '@/hooks/use-mobile';
import PageWalkthrough from './PageWalkthrough';

const BonusesWalkthrough = () => {
  const isMobile = useIsMobile();
  
  const bonusesSteps = [
    {
      id: 'bonuses-welcome',
      title: 'Bonus Features',
      description: "Welcome to the Bonuses section! Here you'll find additional tools to enhance your learning experience.",
      targetSelector: '[data-walkthrough="bonuses-header"]',
      placement: 'bottom' as const,
    },
    {
      id: 'learning-style',
      title: 'Learning Style Quiz',
      description: "Take this quiz to discover your primary learning style and get personalized recommendations.",
      targetSelector: '[data-walkthrough="learning-style-quiz"]',
      placement: 'top' as const,
    },
    {
      id: 'brain-mapping',
      title: 'Brain Mapping',
      description: "Visualize your cognitive patterns and learning pathways with this interactive tool.",
      targetSelector: '[data-walkthrough="brain-mapping"]',
      placement: isMobile ? 'bottom' as const : 'left' as const,
    },
    {
      id: 'navigation',
      title: 'Navigation',
      description: "Use the navigation bar to switch between different sections of the app.",
      targetSelector: '[data-walkthrough="navigation-bar"]',
      placement: 'top' as const,
    }
  ];

  return <PageWalkthrough pagePath="/bonuses" steps={bonusesSteps} />;
};

export default BonusesWalkthrough;
