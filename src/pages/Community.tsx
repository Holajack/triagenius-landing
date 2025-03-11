
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CommunityUserList } from "@/components/community/CommunityUserList";
import { MessageInbox } from "@/components/community/MessageInbox";
import { StudyRooms } from "@/components/community/StudyRooms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavigationBar from "@/components/dashboard/NavigationBar";

const Community = () => {
  return (
    <div className="container max-w-6xl mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Community</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Search people, study rooms..." 
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="people" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="rooms">Study Rooms</TabsTrigger>
        </TabsList>
        
        <TabsContent value="people" className="space-y-4">
          <CommunityUserList />
        </TabsContent>
        
        <TabsContent value="messages" className="space-y-4">
          <MessageInbox />
        </TabsContent>
        
        <TabsContent value="rooms" className="space-y-4">
          <StudyRooms />
        </TabsContent>
      </Tabs>

      <NavigationBar />
    </div>
  );
};

export default Community;
