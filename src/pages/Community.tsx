
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/common/PageHeader';
import NavigationBar from '@/components/dashboard/NavigationBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudyRooms } from '@/components/community/StudyRooms';
import { MessageInbox } from '@/components/community/MessageInbox';
import CommunityUserList from '@/components/community/CommunityUserList';
import CommunityWalkthrough from '@/components/walkthrough/CommunityWalkthrough';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const Community = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user?.id) return;
    
    const presenceChannel = supabase.channel('online-status');
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence state synced');
      })
      .subscribe();
      
    presenceChannel.track({
      user_id: user.id,
      online_at: new Date().toISOString(),
      username: user.username,
    });
    
    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user?.id, user?.username]);

  const handleMessageClick = (userId: string) => {
    navigate(`/community/chat/${userId}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader
        title="Community"
        subtitle="Connect and collaborate with fellow learners"
        data-walkthrough="community-header"
      />

      <div className="container mx-auto px-4 py-8 pb-24">
        <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" data-walkthrough="users">Users</TabsTrigger>
            <TabsTrigger value="messages" data-walkthrough="message-inbox">Messages</TabsTrigger>
            <TabsTrigger value="study-rooms" data-walkthrough="study-rooms">Study Rooms</TabsTrigger>
          </TabsList>
          
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
              aria-label="Search users, messages, or study rooms"
            />
          </div>
          
          <TabsContent value="users" className="space-y-4 mt-4">
            <CommunityUserList searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="messages" className="space-y-4 mt-4">
            <MessageInbox searchQuery={searchQuery} onMessageClick={handleMessageClick} />
          </TabsContent>
          <TabsContent value="study-rooms" className="space-y-4 mt-4">
            <StudyRooms searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </div>

      <div data-walkthrough="navigation-bar">
        <NavigationBar />
      </div>

      <CommunityWalkthrough />
    </div>
  );
};

export default Community;
