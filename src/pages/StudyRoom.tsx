import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Users, BookOpen, Clock, Timer, MessageSquare, Loader2 } from "lucide-react";
import { StudyRoomChat } from "@/components/studyroom/StudyRoomChat";
import { StudyRoomResources } from "@/components/studyroom/StudyRoomResources";
import { StudyRoomMember } from "@/components/studyroom/StudyRoomMember";
import { StartFocusDialog } from "@/components/studyroom/StartFocusDialog";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { HikingTrail } from "@/components/focus/HikingTrail";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { useStudyRooms } from "@/hooks/use-study-rooms";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { requestMediaPermissions } from "@/components/pwa/ServiceWorker";

interface StudyRoomMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  avatar: string;
}

const StudyRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const { user } = useUser();
  const { getRoomById, joinRoom, leaveRoom } = useStudyRooms();
  
  const [room, setRoom] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [showFocusDialog, setShowFocusDialog] = useState(false);
  const [inFocusSession, setInFocusSession] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  
  const { messages: roomMessages, sendMessage: sendRoomMessage } = useRoomMessages(id || "");

  useEffect(() => {
    const loadRoomData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const { data: roomData, error: roomError } = await supabase
          .from('study_rooms')
          .select(`
            *,
            creator:creator_id(id, username, avatar_url)
          `)
          .eq('id', id)
          .single();
          
        if (roomError) throw roomError;
        
        const { data: participantsData, error: participantsError } = await supabase
          .from('study_room_participants')
          .select(`
            *,
            user:user_id(id, username, avatar_url)
          `)
          .eq('room_id', id);
          
        if (participantsError) throw participantsError;
        
        const mappedParticipants = participantsData.map(p => ({
          id: p.id,
          name: p.user.username || `User-${p.user.id.substring(0, 4)}`,
          avatar: p.user.avatar_url || "/placeholder.svg",
          online: true,
          role: p.user_id === roomData.creator_id ? "organizer" : "member"
        }));
        
        if (user?.id) {
          await joinRoom(id);
        }
        
        const enrichedRoomData = {
          ...roomData,
          activeSession: false,
          topic: roomData.description || 'General Study',
          is_active: true,
          schedule: null,
          duration: null,
          subjects: [],
        };
        
        setRoom(enrichedRoomData);
        setParticipants(mappedParticipants);
        
        setResources([
          { id: 1, title: "Study Room Guide", type: "Link", sharedBy: "System", timestamp: "Just now" }
        ]);
      } catch (err) {
        console.error('Error loading study room data:', err);
        toast.error('Could not load study room data');
        navigate('/community');
      } finally {
        setLoading(false);
      }
    };
    
    loadRoomData();
    
    const requestPermissions = async () => {
      await requestMediaPermissions();
    };
    
    requestPermissions();
    
    const channel = supabase.channel(`room_${id}_presence`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        Object.values(state).forEach(presence => {
          const presences = presence as Array<{[key: string]: any}>;
          presences.forEach(p => {
            if (p.user_id) online.add(p.user_id);
          });
        });
        
        setParticipants(current => 
          current.map(p => ({
            ...p,
            online: online.has(p.id)
          }))
        );
      })
      .subscribe();
    
    if (user?.id) {
      channel.track({
        user_id: user.id,
        room_id: id,
        online_at: new Date().toISOString()
      });
    }
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user?.id]);

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
  
  const handleLeaveRoom = async () => {
    if (!id) return;
    
    try {
      const left = await leaveRoom(id);
      if (left) {
        toast.success('Left the study room');
        navigate('/community');
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      toast.error('Failed to leave room');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Loading study room...</p>
      </div>
    );
  }

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
            <div className="flex gap-2">
              {!inFocusSession && (
                <Button className="mt-2 sm:mt-0" onClick={() => setShowFocusDialog(true)}>
                  <Timer className="h-4 w-4 mr-2" />
                  Start Focus Session
                </Button>
              )}
              <Button 
                variant="outline" 
                className="mt-2 sm:mt-0" 
                onClick={handleLeaveRoom}
              >
                Leave Room
              </Button>
            </div>
          </div>
          
          <p className="text-muted-foreground line-clamp-2">{room.description}</p>
          
          <div className="flex flex-wrap gap-1 mt-1">
            {room.subjects?.map((subject: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {subject}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center gap-1 text-sm mt-1">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{participants.length} participants</span>
            <span className="flex -space-x-2 ml-2">
              {participants.slice(0, 3).map((participant: any, index: number) => (
                <Avatar key={index} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback>{participant.name[0]}</AvatarFallback>
                </Avatar>
              ))}
              {participants.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                  +{participants.length - 3}
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
            <StudyRoomChat roomId={id || ""} />
          </TabsContent>
          
          <TabsContent value="resources">
            <StudyRoomResources resources={resources} />
          </TabsContent>
          
          <TabsContent value="members">
            <StudyRoomMember participants={participants} />
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
