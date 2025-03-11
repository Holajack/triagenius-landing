
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mockUsers = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Software Engineering",
    status: "Focusing",
    avatar: "/placeholder.svg",
    online: true,
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Data Science",
    status: "Available",
    avatar: "/placeholder.svg",
    online: true,
  },
  {
    id: 3,
    name: "Emily Wilson",
    role: "Product Design",
    status: "In study room",
    avatar: "/placeholder.svg",
    online: true,
  },
];

export const CommunityUserList = () => {
  return (
    <div className="space-y-4">
      {mockUsers.map((user) => (
        <Card key={user.id} className="p-4">
          <div className="flex items-center gap-4">
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
                <h3 className="font-medium">{user.name}</h3>
                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{user.role}</p>
              <Badge variant="secondary" className="mt-2">
                {user.status}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
