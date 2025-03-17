import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, BookOpen, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface StudyRoom {
  id: number;
  name: string;
  participants: number;
  participantAvatars: string[];
  topic: string;
  active: boolean;
  schedule?: string;
  duration?: string;
  subjects: string[];
  createdBy: string;
}

const mockRooms: StudyRoom[] = [
  {
    id: 1,
    name: "Software Engineering Study Group",
    participants: 4,
    participantAvatars: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    topic: "Data Structures",
    active: true,
    schedule: "Daily, 3-5 PM",
    duration: "2 hours",
    subjects: ["Algorithms", "Programming", "Computer Science"],
    createdBy: "Sarah Johnson"
  },
  {
    id: 2,
    name: "UI/UX Design Workshop",
    participants: 3,
    participantAvatars: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    topic: "User Research",
    active: true,
    schedule: "Tue & Thu, 4-6 PM",
    duration: "2 hours",
    subjects: ["Design", "Usability", "Prototyping"],
    createdBy: "Emily Wilson"
  },
  {
    id: 3,
    name: "Machine Learning Fundamentals",
    participants: 5,
    participantAvatars: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    topic: "Neural Networks",
    active: false,
    schedule: "Mondays, 7-9 PM",
    duration: "2 hours",
    subjects: ["Data Science", "Python", "Statistics"],
    createdBy: "Michael Chen"
  },
  {
    id: 4,
    name: "Product Management Discussion",
    participants: 3,
    participantAvatars: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    topic: "Go-to-Market Strategy",
    active: true,
    schedule: "Wednesdays, 12-1 PM",
    duration: "1 hour",
    subjects: ["Marketing", "Strategy", "Analytics"],
    createdBy: "Jessica Park"
  }
];

interface StudyRoomsProps {
  searchQuery?: string;
  filters?: string[];
}

export const StudyRooms = ({ searchQuery = "", filters = [] }: StudyRoomsProps) => {
  const navigate = useNavigate();
  
  const filteredRooms = mockRooms.filter(room => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      room.name.toLowerCase().includes(searchLower) ||
      room.topic.toLowerCase().includes(searchLower) ||
      room.subjects.some(subject => subject.toLowerCase().includes(searchLower));
    
    if (searchQuery && !matchesSearch) return false;
    
    return true;
  });
  
  const handleJoinRoom = (roomId: number) => {
    navigate(`/study-room/${roomId}`);
  };
  
  const handleCreateRoom = () => {
    toast({
      title: "Creating new study room",
      description: "Feature coming soon: you'll be able to create your own study rooms."
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          onClick={handleCreateRoom}
        >
          <Users className="h-4 w-4" />
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
                  {room.active && (
                    <Badge variant="default" className="bg-green-500 text-xs">Live</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="inline h-3.5 w-3.5 mr-1" />
                  {room.participants} participants
                </p>
              </div>
              <Button 
                variant={room.active ? "default" : "outline"}
                onClick={() => handleJoinRoom(room.id)}
              >
                {room.active ? "Join Now" : "Join Next Session"}
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
                <span className="text-xs text-muted-foreground">Created by {room.createdBy}</span>
              </div>
              
              <div className="flex -space-x-2">
                {room.participantAvatars.slice(0, 3).map((avatar, index) => (
                  <Avatar key={index} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                ))}
                {room.participants > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                    +{room.participants - 3}
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
    </div>
  );
};
