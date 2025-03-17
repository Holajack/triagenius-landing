import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, CheckCircle, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface User {
  id: number;
  name: string;
  role: string;
  status: string;
  avatar: string;
  online: boolean;
  organization: string;
  focusHours: number;
  completedSessions: number;
  isTopPerformer: boolean;
  subjects: string[];
  tasks: string[];
  lastActive: string;
}

const mockUsers: User[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Software Engineering",
    status: "Focusing",
    avatar: "/placeholder.svg",
    online: true,
    organization: "Triage Tech",
    focusHours: 42.5,
    completedSessions: 28,
    isTopPerformer: true,
    subjects: ["React", "TypeScript"],
    tasks: ["Frontend Development", "UI Design"],
    lastActive: "Just now"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Data Science",
    status: "Available",
    avatar: "/placeholder.svg",
    online: true,
    organization: "Triage Tech",
    focusHours: 38.1,
    completedSessions: 24,
    isTopPerformer: true,
    subjects: ["Python", "Machine Learning"],
    tasks: ["Data Analysis", "Model Training"],
    lastActive: "2m ago"
  },
  {
    id: 3,
    name: "Emily Wilson",
    role: "Product Design",
    status: "In study room",
    avatar: "/placeholder.svg",
    online: true,
    organization: "Triage Design",
    focusHours: 32.8,
    completedSessions: 20,
    isTopPerformer: false,
    subjects: ["UI/UX", "Design Systems"],
    tasks: ["User Research", "Wireframing"],
    lastActive: "5m ago"
  },
  {
    id: 4,
    name: "David Miller",
    role: "Marketing",
    status: "Away",
    avatar: "/placeholder.svg",
    online: false,
    organization: "Triage Tech",
    focusHours: 29.4,
    completedSessions: 18,
    isTopPerformer: false,
    subjects: ["Content Strategy", "Social Media"],
    tasks: ["Campaign Analysis", "Content Creation"],
    lastActive: "1h ago"
  },
  {
    id: 5,
    name: "Jessica Park",
    role: "Product Management",
    status: "Available",
    avatar: "/placeholder.svg",
    online: true,
    organization: "Triage Tech",
    focusHours: 35.2,
    completedSessions: 22,
    isTopPerformer: false,
    subjects: ["Product Strategy", "Agile"],
    tasks: ["Roadmapping", "Feature Prioritization"],
    lastActive: "30m ago"
  },
];

interface CommunityUserListProps {
  searchQuery?: string;
  filters?: string[];
}

export const CommunityUserList = ({ searchQuery = "", filters = [] }: CommunityUserListProps) => {
  const navigate = useNavigate();
  
  const filteredUsers = mockUsers.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      user.subjects.some(subject => subject.toLowerCase().includes(searchLower)) ||
      user.tasks.some(task => task.toLowerCase().includes(searchLower));
    
    if (searchQuery && !matchesSearch) return false;
    
    if (filters.length > 0) {
      if (filters.includes("Same Organization") && user.organization !== "Triage Tech") return false;
      if (filters.includes("Online Now") && !user.online) return false;
      if (filters.includes("Top Performers") && !user.isTopPerformer) return false;
    }
    
    return true;
  });
  
  const handleMessageUser = (userId: number) => {
    navigate(`/community/chat/${userId}`);
  };
  
  return (
    <div className="space-y-4">
      {filteredUsers.map((user) => (
        <Card key={user.id} className="p-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              {user.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{user.name}</h3>
                  {user.isTopPerformer && (
                    <Trophy className="h-4 w-4 text-yellow-500" aria-label="Top Performer" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{user.lastActive}</span>
              </div>
              
              <p className="text-sm text-muted-foreground">{user.role}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" aria-label="Last active" />
                  {user.focusHours}h
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {user.completedSessions} sessions
                </Badge>
                <Badge variant={user.online ? "default" : "outline"}>
                  {user.status}
                </Badge>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-1">
                {user.subjects.map((subject, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-muted/40">
                    {subject}
                  </Badge>
                ))}
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    toast("Feature coming soon", {
                      description: "You'll be able to view detailed profiles in the future."
                    });
                  }}
                >
                  View Profile
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleMessageUser(user.id)}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Message
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
      
      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users match your search or filters</p>
        </div>
      )}
    </div>
  );
};
