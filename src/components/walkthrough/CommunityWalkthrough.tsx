
import { useIsMobile } from '@/hooks/use-mobile';
import PageWalkthrough from './PageWalkthrough';
import { WalkthroughStep } from '@/contexts/WalkthroughContext';

const CommunityWalkthrough = () => {
  const isMobile = useIsMobile();

  const communitySteps: WalkthroughStep[] = [
    {
      id: 'community-welcome',
      title: 'Community Hub',
      description: "Connect with others on their focus journey and join collaborative study sessions.",
      targetSelector: '[data-walkthrough="community-header"]',
      placement: 'bottom',
    },
    {
      id: 'users',
      title: 'Users',
      description: "Find and connect with other users in the community.",
      targetSelector: '[data-walkthrough="users"]',
      placement: isMobile ? 'bottom' : 'right',
    },
    {
      id: 'messages',
      title: 'Messages',
      description: "Check your messages and connect with friends in the community.",
      targetSelector: '[data-walkthrough="message-inbox"]',
      placement: 'top',
    },
    {
      id: 'study-rooms',
      title: 'Study Rooms',
      description: "Join or create virtual study rooms to focus together with others.",
      targetSelector: '[data-walkthrough="study-rooms"]',
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

  return <PageWalkthrough pageName="community" steps={communitySteps} />;
};

export default CommunityWalkthrough;
