import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Send, Users, BookOpen, Clock, Timer, MessageSquare } from "lucide-react";
import { StudyRoomChat } from "@/components/studyroom/StudyRoomChat";
import { StudyRoomResources } from "@/components/studyroom/StudyRoomResources";
import { StudyRoomMember } from "@/components/studyroom/StudyRoomMember";
import { StartFocusDialog } from "@/components/studyroom/StartFocusDialog";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { HikingTrail } from "@/components/focus/HikingTrail";
import { FocusTimer } from "@/components/focus/FocusTimer";

const getMockRoom = (roomId: string) => {
  const rooms = {
    "1": {
      id: 1,
      name: "Software Engineering Study Group",
      topic: "Data Structures",
      description: "A group focused on software engineering fundamentals, algorithms, and data structures",
      participants: [
        { id: 1, name: "Sarah Johnson", avatar: "/placeholder.svg", online: true, role: "organizer" },
        { id: 2, name: "Michael Chen", avatar: "/placeholder.svg", online: true, role: "member" },
        { id: 3, name: "Emily Wilson", avatar: "/placeholder.svg", online: false, role: "member" },
        { id: 4, name: "David Park", avatar: "/placeholder.svg", online: true, role: "member" }
      ],
      subjects: ["Algorithms", "Programming", "Computer Science"],
      schedule: "Daily, 3-5 PM",
      duration: "2 hours",
      messages: [
        { id: 1, sender: "Sarah Johnson", content: "Welcome everyone to our study session!", timestamp: "10:30 AM", avatar: "/placeholder.svg" },
        { id: 2, name: "Michael Chen", content: "Has everyone reviewed the materials for today?", timestamp: "10:32 AM", avatar: "/placeholder.svg" },
        { id: 3, sender: "Emily Wilson", content: "Yes, I've gone through the reading list!", timestamp: "10:34 AM", avatar: "/placeholder.svg" }
      ],
      resources: [
        { id: 1, title: "Introduction to Algorithms", type: "PDF", sharedBy: "Sarah Johnson", timestamp: "Yesterday" },
        { id: 2, title: "Data Structures Cheat Sheet", type: "Link", sharedBy: "Michael Chen", timestamp: "2 days ago" }
      ],
      activeSession: false
    },
    "2": {
      id: 2,
      name: "UI/UX Design Workshop",
      topic: "User Research",
      description: "A collaborative workshop focused on user interface design principles and usability testing",
      participants: [
        { id: 5, name: "Jessica Park", avatar: "/placeholder.svg", online: true, role: "organizer" },
        { id: 6, name: "Ryan Kim", avatar: "/placeholder.svg", online: false, role: "member" },
        { id: 7, name: "Alex Turner", avatar: "/placeholder.svg", online: true, role: "member" }
      ],
      subjects: ["Design", "Usability", "Prototyping"],
      schedule: "Tue & Thu, 4-6 PM",
      duration: "2 hours",
      messages: [
        { id: 1, sender: "Jessica Park", content: "Let's discuss the prototyping assignment", timestamp: "2:15 PM", avatar: "/placeholder.svg" },
        { id: 2, sender: "Alex Turner", content: "I've created a few wireframes to share", timestamp: "2:18 PM", avatar: "/placeholder.svg" }
      ],
      resources: [
        { id: 1, title: "UI Design Patterns", type: "Link", sharedBy: "Jessica Park", timestamp: "3 days ago" }
      ],
      activeSession: false
    }
  };
  
  return rooms[roomId as keyof typeof rooms] || null;
};

const StudyRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useOnboarding();
  
  const [room, setRoom] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [showFocusDialog, setShowFocusDialog] = useState(false);
  const [inFocusSession, setInFocusSession] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (id) {
      const roomData = getMockRoom(id);
      if (roomData) {
        setRoom(roomData);
      }
    }
  }, [id]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: room.messages.length + 1,
      sender: "You",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: "/placeholder.svg"
    };
    
    setRoom({
      ...room,
      messages: [...room.messages, newMessage]
    });
    
    setMessage("");
  };

  const handleStartFocusSession = (duration: number) => {
    setShowFocusDialog(false);
    setInFocusSession(true);
    
    setRoom({
      ...room,
      activeSession: true
    });
    
    toast("Focus session started! The team is now focused.", {
      description: `${duration} minute session has begun`,
      position: "top-center"
    });
  };

  const handlePause = () => {
    setIsPaused(true);
  };
  
  const handleResume = () => {
    setIsPaused(false);
  };
  
  const handleSessionEnd = () => {
    setInFocusSession(false);
    
    setRoom({
      ...room,
      activeSession: false
    });
    
    toast("Focus session completed!", {
      description: "Great job everyone.",
      position: "top-center"
    });
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Study room not found</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 pb-24 min-h-screen bg-background">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/community')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold truncate">{room.name}</h1>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="font-medium">Topic:</span> 
              <span className="truncate">{room.topic}</span>
            </div>
            {!inFocusSession && (
              <Button className="mt-2 sm:mt-0" onClick={() => setShowFocusDialog(true)}>
                <Timer className="h-4 w-4 mr-2" />
                Start Focus Session
              </Button>
            )}
          </div>
          
          <p className="text-muted-foreground line-clamp-2">{room.description}</p>
          
          <div className="flex flex-wrap gap-1 mt-1">
            {room.subjects.map((subject: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {subject}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center gap-1 text-sm mt-1">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{room.participants.length} participants</span>
            <span className="flex -space-x-2 ml-2">
              {room.participants.slice(0, 3).map((participant: any, index: number) => (
                <Avatar key={index} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback>{participant.name[0]}</AvatarFallback>
                </Avatar>
              ))}
              {room.participants.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                  +{room.participants.length - 3}
                </div>
              )}
            </span>
          </div>
        </div>
      </Card>

      {inFocusSession ? (
        <div className="mb-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Group Focus Session In Progress</h2>
            <p className="text-muted-foreground">Everyone is focusing together. Stay on task!</p>
          </div>
          
          <FocusTimer
            onPause={handlePause}
            onResume={handleResume}
            onComplete={handleSessionEnd}
            isPaused={isPaused}
          />
          
          <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden">
            <HikingTrail environment={state.environment} milestone={0} />
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Your focus contributes to the group's progress!</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex gap-2 items-center">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
              <span className="sm:hidden">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex gap-2 items-center">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Resources</span>
              <span className="sm:hidden">Resources</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex gap-2 items-center">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
              <span className="sm:hidden">Members</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat">
            <StudyRoomChat 
              messages={room.messages} 
              onSendMessage={handleSendMessage}
              message={message}
              setMessage={setMessage}
            />
          </TabsContent>
          
          <TabsContent value="resources">
            <StudyRoomResources resources={room.resources} />
          </TabsContent>
          
          <TabsContent value="members">
            <StudyRoomMember participants={room.participants} />
          </TabsContent>
        </Tabs>
      )}

      <StartFocusDialog
        open={showFocusDialog}
        onOpenChange={setShowFocusDialog}
        onStartSession={handleStartFocusSession}
      />
    </div>
  );
};

export default StudyRoom;
