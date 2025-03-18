
import { useIsMobile } from '@/hooks/use-mobile';
import PageWalkthrough from './PageWalkthrough';

const CommunityWalkthrough = () => {
  const isMobile = useIsMobile();
  
  const communitySteps = [
    {
      id: 'community-welcome',
      title: 'Community Hub',
      description: "Welcome to the Community section! Connect with other users and join study rooms.",
      targetSelector: '[data-walkthrough="community-header"]',
      placement: 'bottom' as const,
    },
    {
      id: 'study-rooms',
      title: 'Study Rooms',
      description: "Join or create study rooms to focus together with other users.",
      targetSelector: '[data-walkthrough="study-rooms"]',
      placement: 'top' as const,
    },
    {
      id: 'user-list',
      title: 'Online Users',
      description: "See who's currently online and connect with other learners.",
      targetSelector: '[data-walkthrough="community-users"]',
      placement: isMobile ? 'bottom' as const : 'right' as const,
    },
    {
      id: 'messages',
      title: 'Messages',
      description: "Check your messages and chat with other users.",
      targetSelector: '[data-walkthrough="message-inbox"]',
      placement: 'top' as const,
    },
    {
      id: 'navigation',
      title: 'Navigation',
      description: "Use the navigation bar to switch between different sections of the app.",
      targetSelector: '[data-walkthrough="navigation-bar"]',
      placement: 'top' as const,
    }
  ];

  return <PageWalkthrough pagePath="/community" steps={communitySteps} />;
};

export default CommunityWalkthrough;
