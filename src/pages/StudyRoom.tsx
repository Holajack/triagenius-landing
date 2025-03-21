
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Users, BookOpen, Clock, Timer, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { StudyRoomChat } from "@/components/studyroom/StudyRoomChat";
import { StudyRoomResources } from "@/components/studyroom/StudyRoomResources";
import { StudyRoomMember } from "@/components/studyroom/StudyRoomMember";
import { StartFocusDialog } from "@/components/studyroom/StartFocusDialog";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { HikingTrail } from "@/components/focus/HikingTrail";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { useStudyRooms } from "@/hooks/use-study-rooms";
import { useUser } from "@/hooks/use-user";
import { useRoomMessages } from "@/hooks/use-room-messages";
import { supabase } from "@/integrations/supabase/client";
import { requestMediaPermissions } from "@/components/pwa/ServiceWorker";

const StudyRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const { user } = useUser();
  const { getRoomById, joinRoom, leaveRoom } = useStudyRooms();
  
  const [room, setRoom] = useState<any>(null);
  const [showFocusDialog, setShowFocusDialog] = useState(false);
  const [inFocusSession, setInFocusSession] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [presenceChannel, setPresenceChannel] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const hasJoinedRef = useRef(false);

  // Effect for loading room data
  useEffect(() => {
    const loadRoomData = async () => {
      if (!id) {
        setLoadError("No room ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log(`Loading room data for ID: ${id}`);
        
        const { data: roomData, error: roomError } = await supabase
          .from('study_rooms')
          .select(`
            *,
            creator:creator_id(id, username, avatar_url)
          `)
          .eq('id', id)
          .single();
          
        if (roomError) {
          console.error("Error fetching room data:", roomError);
          setLoadError(roomError.message);
          setLoading(false);
          return;
        }
        
        console.log("Room data fetched:", roomData);
        
        const { data: participantsData, error: participantsError } = await supabase
          .from('study_room_participants')
          .select(`
            *,
            user:user_id(id, username, avatar_url)
          `)
          .eq('room_id', id);
          
        if (participantsError) {
          console.error("Error fetching participants:", participantsError);
          setLoadError(participantsError.message);
          setLoading(false);
          return;
        }
        
        console.log("Participants data fetched:", participantsData);
        
        const mappedParticipants = participantsData.map(p => ({
          id: p.user.id,
          name: p.user.username || `User-${p.user.id.substring(0, 4)}`,
          avatar: p.user.avatar_url || "/placeholder.svg",
          online: false, // Will be updated by presence
          role: p.user_id === roomData.creator_id ? "organizer" : "member"
        }));
        
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
        setLoadError(null);
        
        setResources([
          { id: 1, title: "Study Room Guide", type: "Link", sharedBy: "System", timestamp: "Just now" }
        ]);
      } catch (err) {
        console.error('Error loading study room data:', err);
        setLoadError('Could not load study room data');
        toast.error('Could not load study room data');
      } finally {
        setLoading(false);
      }
    };
    
    loadRoomData();
    
    // Separate useEffect for media permissions
    const requestPermissions = async () => {
      await requestMediaPermissions();
    };
    
    requestPermissions();
  }, [id]); // Removed joinRoom and navigate from dependencies

  // Separate useEffect for joining the room
  useEffect(() => {
    // Only attempt to join if room data is loaded, user exists, and we haven't already joined
    if (room && user?.id && !hasJoinedRef.current && !isJoining) {
      const attemptJoinRoom = async () => {
        setIsJoining(true);
        try {
          console.log(`Attempting to join room ${id} for user ${user.id}`);
          await joinRoom(id || "");
          console.log("Successfully joined room");
          hasJoinedRef.current = true;
        } catch (joinError) {
          console.error("Error joining room:", joinError);
          toast.error("Failed to join the study room");
        } finally {
          setIsJoining(false);
        }
      };
      
      attemptJoinRoom();
    }
  }, [room, user?.id, id, joinRoom, isJoining]);

  // Separate useEffect for presence channel
  useEffect(() => {
    if (!id || !user?.id) return;
    
    console.log(`Setting up presence channel for room ${id}`);
    const channel = supabase.channel(`room_${id}_presence`, {
      config: {
        presence: {
          key: user?.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presences = Object.values(state).flat();
        const online = new Set();
        
        presences.forEach((presence: any) => {
          if (presence.user_id) {
            online.add(presence.user_id);
          }
        });
        
        setParticipants(current => 
          current.map(p => ({
            ...p,
            online: online.has(p.id)
          }))
        );
        
        console.log('Room presence synced, online users:', online.size);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined room:', newPresences);
        toast.info(`${newPresences[0]?.username || 'Someone'} joined the room`, {
          duration: 3000,
          position: 'bottom-right',
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left room:', leftPresences);
        toast.info(`${leftPresences[0]?.username || 'Someone'} left the room`, {
          duration: 3000,
          position: 'bottom-right',
        });
      });
    
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && user?.id) {
        await channel.track({
          user_id: user.id,
          room_id: id,
          username: user.username || `User-${user.id.substring(0, 4)}`,
          online_at: new Date().toISOString()
        });
        
        console.log('Tracking presence for user:', user.id);
      }
    });
    
    setPresenceChannel(channel);
    
    return () => {
      console.log('Removing presence channel');
      supabase.removeChannel(channel);
    };
  }, [id, user?.id, user?.username]);

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
      if (presenceChannel && user?.id) {
        await presenceChannel.untrack();
      }
      
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

  // Loading state with timeout
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  
  useEffect(() => {
    let timeoutId: number;
    
    if (loading) {
      // Show a warning after 10 seconds if still loading
      timeoutId = window.setTimeout(() => {
        setShowTimeoutWarning(true);
      }, 10000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="mb-2">Loading study room...</p>
        
        {showTimeoutWarning && (
          <div className="max-w-md text-center mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-amber-700 mb-2">This is taking longer than expected.</p>
            <Button variant="outline" onClick={() => navigate('/community')}>
              Return to Community
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (loadError || !room) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Study Room Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {loadError || "The study room you're looking for doesn't exist or you don't have access to it."}
          </p>
          <Button onClick={() => navigate('/community')}>
            Back to Community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 pb-24 min-h-screen bg-background">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/community')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold truncate">{room.name}</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLeaveRoom}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Leave Room
        </Button>
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
                <Button onClick={() => setShowFocusDialog(true)}>
                  <Timer className="h-4 w-4 mr-2" />
                  Start Focus Session
                </Button>
              )}
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
            <span>{participants.filter(p => p.online).length} online</span>
            <span className="text-muted-foreground">of {participants.length} participants</span>
            <span className="flex -space-x-2 ml-2">
              {participants.filter(p => p.online).slice(0, 3).map((participant: any, index: number) => (
                <Avatar key={index} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback>{participant.name[0]}</AvatarFallback>
                </Avatar>
              ))}
              {participants.filter(p => p.online).length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                  +{participants.filter(p => p.online).length - 3}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 order-2 md:order-1">
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Users ({participants.filter(p => p.online).length})
              </h3>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {participants.filter(p => p.online).map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback>{participant.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{participant.name}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
                        <span>{participant.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {participants.filter(p => p.online).length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    <p>No active users</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          <div className="md:col-span-3 order-1 md:order-2">
            <StudyRoomChat roomId={id || ""} />
          </div>
        </div>
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
