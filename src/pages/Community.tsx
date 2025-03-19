
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, Filter } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import NavigationBar from '@/components/dashboard/NavigationBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudyRooms } from '@/components/community/StudyRooms';
import { MessageInbox } from '@/components/community/MessageInbox';
import CommunityUserList from '@/components/community/CommunityUserList';
import CommunityWalkthrough from '@/components/walkthrough/CommunityWalkthrough';

const Community = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mt-4 mb-2">
          <PageHeader
            title="Community"
            subtitle="Connect with colleagues and study partners"
            data-walkthrough="community-header"
          />
          <Button size="sm" variant="outline" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications On
          </Button>
        </div>

        {/* Search bar */}
        <div className="mb-4 mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Search people, messages, study rooms..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters button */}
        <div className="mb-4">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Main content */}
        <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" data-walkthrough="users-tab">People</TabsTrigger>
            <TabsTrigger value="messages" data-walkthrough="message-inbox">Messages</TabsTrigger>
            <TabsTrigger value="study-rooms" data-walkthrough="study-rooms">Study Rooms</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="space-y-4 mt-4">
            <CommunityUserList searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="messages" className="space-y-4 mt-4">
            <MessageInbox searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="study-rooms" className="space-y-4 mt-4">
            <StudyRooms searchQuery={searchQuery} />
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
