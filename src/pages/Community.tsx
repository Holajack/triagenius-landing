import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import StudyRooms from '@/components/community/StudyRooms';
import CommunityUserList from '@/components/community/CommunityUserList';
import MessageInbox from '@/components/community/MessageInbox';
import NavigationBar from '@/components/dashboard/NavigationBar';
import CommunityWalkthrough from '@/components/walkthrough/CommunityWalkthrough';

const Community = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div data-walkthrough="community-header">
        <PageHeader title="Community" subtitle="Connect with others and join study rooms" />
      </div>
      
      <div className="container mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div data-walkthrough="study-rooms">
              <StudyRooms />
            </div>
          </div>
          <div className="space-y-6">
            <div data-walkthrough="community-users">
              <CommunityUserList />
            </div>
            <div data-walkthrough="message-inbox">
              <MessageInbox />
            </div>
          </div>
        </div>
      </div>
      
      <div data-walkthrough="navigation-bar">
        <NavigationBar />
      </div>
      
      <CommunityWalkthrough />
    </div>
  );
};

export default Community;
