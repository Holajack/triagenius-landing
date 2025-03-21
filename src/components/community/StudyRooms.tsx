import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, BookOpen, Calendar, Plus, Loader2, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useStudyRooms } from "@/hooks/use-study-rooms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/use-user";
import { requestMediaPermissions } from "@/components/pwa/ServiceWorker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface StudyRoomsProps {
  searchQuery?: string;
  filters?: string[];
}

export const StudyRooms = ({ searchQuery = "", filters = [] }: StudyRoomsProps) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { rooms, loading, error: roomsError, createRoom, joinRoom } = useStudyRooms();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topic: '',
    schedule: '',
    duration: '',
    subjects: [] as string[],
    newSubject: ''
  });
  const [activeRoomIds, setActiveRoomIds] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase.channel('active-study-rooms');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeRooms = new Set<string>();
        
        Object.keys(state).forEach(presenceKey => {
          const presences = state[presenceKey] as any[];
          presences.forEach(presence => {
            if (presence.roomId) {
              activeRooms.add(presence.roomId);
            }
          });
        });
        
        setActiveRoomIds(activeRooms);
      })
      .subscribe();
      
    if (window.location.pathname.includes('/community/room/')) {
      const roomId = window.location.pathname.split('/').pop();
      if (roomId) {
        channel.track({
          userId: user.id,
          roomId: roomId,
          joined_at: new Date().toISOString(),
        });
      }
    }
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  
  const filteredRooms = rooms.filter(room => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      room.name.toLowerCase().includes(searchLower) ||
      room.topic.toLowerCase().includes(searchLower) ||
      room.subjects.some(subject => subject.toLowerCase().includes(searchLower)) ||
      (room.description?.toLowerCase().includes(searchLower) || false);
    
    if (searchQuery && !matchesSearch) return false;
    
    return true;
  }).map(room => ({
    ...room,
    is_active: activeRoomIds.has(room.id) || room.is_active
  }));
  
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Room name is required';
    }
    
    if (!formData.topic.trim()) {
      errors.topic = 'Topic is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleJoinRoom = async (roomId: string) => {
    try {
      const loadingToast = toast.loading('Joining study room...');
      
      await requestMediaPermissions();
      
      const joined = await joinRoom(roomId);
      
      toast.dismiss(loadingToast);
      
      if (joined) {
        navigate(`/study-room/${roomId}`);
      } else {
        toast.error('Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room. Please try again.');
    }
  };
  
  const handleCreateRoom = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsCreating(true);
    
    try {
      const newRoom = await createRoom({
        name: formData.name,
        description: formData.description,
        topic: formData.topic,
        schedule: formData.schedule,
        duration: formData.duration,
        subjects: formData.subjects,
      });
      
      if (newRoom) {
        setShowCreateDialog(false);
        setFormData({
          name: '',
          description: '',
          topic: '',
          schedule: '',
          duration: '',
          subjects: [],
          newSubject: ''
        });
        
        navigate(`/community/room/${newRoom.id}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };
  
  const addSubject = () => {
    if (!formData.newSubject.trim()) return;
    
    if (formData.subjects.includes(formData.newSubject.trim())) {
      toast.error('This subject is already added');
      return;
    }
    
    setFormData({
      ...formData,
      subjects: [...formData.subjects, formData.newSubject.trim()],
      newSubject: ''
    });
  };
  
  const removeSubject = (subject: string) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter(s => s !== subject)
    });
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    if (formErrors[field]) {
      setFormErrors({
        ...formErrors,
        [field]: ''
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading study rooms...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          onClick={() => setShowCreateDialog(true)}
          disabled={!user}
        >
          <Plus className="h-4 w-4" />
          Create Study Room
        </Button>
      </div>
      
      {roomsError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading study rooms: {roomsError.message}
          </AlertDescription>
        </Alert>
      )}
      
      {filteredRooms.map((room) => (
        <Card key={room.id} className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{room.name}</h3>
                  {room.is_active && (
                    <Badge variant="default" className="bg-green-500 text-xs">Live</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="inline h-3.5 w-3.5 mr-1" />
                  {room.participant_count} participants
                </p>
              </div>
              <Button 
                variant={room.is_active ? "default" : "outline"}
                onClick={() => handleJoinRoom(room.id)}
              >
                {room.is_active ? "Join Now" : "Join Next Session"}
              </Button>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Topic:</span> {room.topic}
              </div>
              
              {room.schedule && (
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Schedule:</span> {room.schedule}
                </div>
              )}
              
              {room.duration && (
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Duration:</span> {room.duration}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1 mt-1">
              {room.subjects && room.subjects.map((subject, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {subject}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Created by {room.creator?.username || 'Unknown'}
                </span>
              </div>
              
              <div className="flex -space-x-2">
                {room.participants?.slice(0, 3).map((participant, index) => (
                  <Avatar key={index} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={participant.user.avatar_url || ""} />
                    <AvatarFallback>{participant.user.username?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                ))}
                {(room.participant_count || 0) > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                    +{(room.participant_count || 0) - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
      
      {filteredRooms.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No study rooms match your search</p>
        </div>
      )}
      
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) {
          setFormErrors({});
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Study Room</DialogTitle>
            <DialogDescription>
              Create a new study room to collaborate with other students
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className={formErrors.name ? "text-destructive" : ""}>
                Room Name *
              </Label>
              <Input 
                id="name" 
                placeholder="e.g. Math Study Group" 
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="topic" className={formErrors.topic ? "text-destructive" : ""}>
                Topic *
              </Label>
              <Input 
                id="topic" 
                placeholder="e.g. Calculus 101" 
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                className={formErrors.topic ? "border-destructive" : ""}
              />
              {formErrors.topic && (
                <p className="text-xs text-destructive">{formErrors.topic}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe what you'll be studying..." 
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="schedule">Schedule (optional)</Label>
                <Input 
                  id="schedule" 
                  placeholder="e.g. Daily, 3-5 PM" 
                  value={formData.schedule}
                  onChange={(e) => handleInputChange('schedule', e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (optional)</Label>
                <Input 
                  id="duration" 
                  placeholder="e.g. 2 hours" 
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Subjects</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add a subject..." 
                  value={formData.newSubject}
                  onChange={(e) => setFormData({...formData, newSubject: e.target.value})}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSubject();
                    }
                  }}
                />
                <Button type="button" onClick={addSubject}>Add</Button>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.subjects.map((subject, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {subject}
                    <button 
                      className="ml-1 text-xs hover:text-destructive"
                      onClick={() => removeSubject(subject)}
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
                {formData.subjects.length === 0 && (
                  <span className="text-xs text-muted-foreground">No subjects added yet</span>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateRoom} 
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
