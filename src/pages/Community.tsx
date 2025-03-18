
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Search, Filter, User, Users, MessageSquare, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CommunityUserList } from "@/components/community/CommunityUserList";
import { MessageInbox } from "@/components/community/MessageInbox";
import { StudyRooms } from "@/components/community/StudyRooms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { requestNotificationPermission } from "@/components/pwa/ServiceWorker";
import { toast } from "sonner";

const Community = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const navigate = useNavigate();
  const { getUnreadCount } = useRealtimeMessages();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const filters = [
    "Same Organization", 
    "Similar Tasks", 
    "Same Subject",
    "Online Now", 
    "Top Performers"
  ];
  
  const toggleFilter = (filter: string) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter(f => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };
  
  // Check notification permission on component mount
  useEffect(() => {
    const checkNotificationPermission = async () => {
      try {
        const result = await requestNotificationPermission();
        setNotificationsEnabled(result);
      } catch (error) {
        console.error('Error checking notification permission:', error);
      }
    };
    
    checkNotificationPermission();
  }, []);
  
  // Request camera and microphone permissions for video calls
  const handleEnableNotifications = async () => {
    try {
      const result = await requestNotificationPermission();
      setNotificationsEnabled(result);
      
      if (result) {
        toast.success('Notifications enabled');
      } else {
        toast.error('Notification permission denied', {
          description: 'Please enable notifications in your browser settings'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Could not enable notifications');
    }
  };
  
  return (
    <div className="container max-w-6xl mx-auto p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Community</h1>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex gap-2 items-center"
          onClick={handleEnableNotifications}
        >
          <Bell className="h-4 w-4" />
          {notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}
        </Button>
      </div>
      <p className="text-muted-foreground mb-6">Connect with colleagues and study partners</p>
      
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search people, messages, study rooms..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {filters.map(filter => (
                <DropdownMenuItem 
                  key={filter}
                  onClick={() => toggleFilter(filter)}
                  className="flex items-center gap-2"
                >
                  <div className={`w-3 h-3 rounded-full ${selectedFilters.includes(filter) ? "bg-primary" : "bg-muted"}`} />
                  {filter}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {selectedFilters.map(filter => (
            <Badge 
              key={filter} 
              variant="secondary"
              className="whitespace-nowrap"
            >
              {filter}
              <button 
                className="ml-1 text-xs hover:text-primary"
                onClick={() => toggleFilter(filter)}
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="people" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="people" className="flex gap-2 items-center">
            <User className="h-4 w-4" />
            People
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex gap-2 items-center">
            <MessageSquare className="h-4 w-4" />
            Messages
            {getUnreadCount() > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 rounded-full flex items-center justify-center">
                {getUnreadCount()}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex gap-2 items-center">
            <Users className="h-4 w-4" />
            Study Rooms
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="people" className="space-y-4">
          <CommunityUserList searchQuery={searchQuery} filters={selectedFilters} />
        </TabsContent>
        
        <TabsContent value="messages" className="space-y-4">
          <MessageInbox 
            searchQuery={searchQuery} 
            onMessageClick={(userId) => navigate(`/community/chat/${userId}`)} 
          />
        </TabsContent>
        
        <TabsContent value="rooms" className="space-y-4">
          <StudyRooms searchQuery={searchQuery} filters={selectedFilters} />
        </TabsContent>
      </Tabs>

      <NavigationBar />
    </div>
  );
};

export default Community;
