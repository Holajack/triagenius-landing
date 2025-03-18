
import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/common/PageHeader';
import NavigationBar from '@/components/dashboard/NavigationBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudyRooms } from '@/components/community/StudyRooms';
import { MessageInbox } from '@/components/community/MessageInbox';
import CommunityUserList from '@/components/community/CommunityUserList';
import CommunityWalkthrough from '@/components/walkthrough/CommunityWalkthrough';

const Community = () => {
  const [activeTab, setActiveTab] = useState("study-rooms");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader
        title="Study Community"
        subtitle="Connect with like-minded learners and accelerate your progress through collaboration"
        data-walkthrough="community-header"
      />

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 pb-24">
        <Tabs defaultValue="study-rooms" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="study-rooms" data-walkthrough="study-rooms">Study Rooms</TabsTrigger>
            <TabsTrigger value="messages" data-walkthrough="message-inbox">Messages</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          <TabsContent value="study-rooms" className="space-y-4 mt-4">
            <StudyRooms />
          </TabsContent>
          <TabsContent value="messages" className="space-y-4 mt-4">
            <MessageInbox />
          </TabsContent>
          <TabsContent value="users" className="space-y-4 mt-4">
            <CommunityUserList />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add navigation bar with data-walkthrough attribute */}
      <div data-walkthrough="navigation-bar">
        <NavigationBar />
      </div>

      {/* Add the community walkthrough component */}
      <CommunityWalkthrough />
    </div>
  );
};

export default Community;
