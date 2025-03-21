import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, BookOpen, Calendar, Plus, Loader2 } from "lucide-react";
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

interface StudyRoomsProps {
  searchQuery?: string;
  filters?: string[];
}

export const StudyRooms = ({ searchQuery = "", filters = [] }: StudyRoomsProps) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { rooms, loading, createRoom, joinRoom } = useStudyRooms();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topic: '',
    schedule: '',
    duration: '',
    subjects: [] as string[],
    newSubject: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  const filteredRooms = rooms.filter(room => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      room.name.toLowerCase().includes(searchLower) ||
      room.topic.toLowerCase().includes(searchLower) ||
      room.subjects.some(subject => subject.toLowerCase().includes(searchLower)) ||
      (room.description?.toLowerCase().includes(searchLower) || false);
    
    if (searchQuery && !matchesSearch) return false;
    
    return true;
  });
  
  const handleJoinRoom = async (roomId: string) => {
    try {
      const permissions = await requestMediaPermissions();
      console.log('Media permissions:', permissions);
      
      if (permissions.audio || permissions.video) {
        toast.success(`${permissions.audio ? 'Microphone' : ''}${permissions.audio && permissions.video ? ' and ' : ''}${permissions.video ? 'Camera' : ''} access granted`);
      }
      
      const joined = await joinRoom(roomId);
      if (joined) {
        navigate(`/community/room/${roomId}`);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    }
  };
  
  const handleCreateRoom = async () => {
    if (!formData.name || !formData.topic) {
      toast.error('Please enter a name and topic for your study room');
      return;
    }
    
    setFormSubmitting(true);
    
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
        
        navigate(`/study-room/${newRoom.id}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setFormSubmitting(false);
    }
  };
  
  const addSubject = () => {
    if (!formData.newSubject.trim()) return;
    
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
              {room.subjects.map((subject, index) => (
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
      
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Study Room</DialogTitle>
            <DialogDescription>
              Create a new study room to collaborate with other students
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Room Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Math Study Group" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={formSubmitting}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="topic">Topic</Label>
              <Input 
                id="topic" 
                placeholder="e.g. Calculus 101" 
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                disabled={formSubmitting}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe what you'll be studying..." 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                disabled={formSubmitting}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="schedule">Schedule (optional)</Label>
                <Input 
                  id="schedule" 
                  placeholder="e.g. Daily, 3-5 PM" 
                  value={formData.schedule}
                  onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                  disabled={formSubmitting}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (optional)</Label>
                <Input 
                  id="duration" 
                  placeholder="e.g. 2 hours" 
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  disabled={formSubmitting}
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
                  disabled={formSubmitting}
                />
                <Button type="button" onClick={addSubject} disabled={formSubmitting}>Add</Button>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.subjects.map((subject, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {subject}
                    <button 
                      className="ml-1 text-xs hover:text-destructive"
                      onClick={() => removeSubject(subject)}
                      disabled={formSubmitting}
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
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={formSubmitting}>Cancel</Button>
            <Button onClick={handleCreateRoom} disabled={formSubmitting}>
              {formSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : 'Create Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
