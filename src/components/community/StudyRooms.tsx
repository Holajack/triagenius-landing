
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

const mockRooms = [
  {
    id: 1,
    name: "Software Engineering Study Group",
    participants: 4,
    topic: "Data Structures",
    active: true,
  },
  {
    id: 2,
    name: "UI/UX Design Workshop",
    participants: 3,
    topic: "User Research",
    active: true,
  }
];

export const StudyRooms = () => {
  return (
    <div className="space-y-4">
      {mockRooms.map((room) => (
        <Card key={room.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{room.name}</h3>
              <p className="text-sm text-muted-foreground">
                <Users className="inline h-4 w-4 mr-1" />
                {room.participants} participants
              </p>
              <Badge variant="secondary" className="mt-2">
                {room.topic}
              </Badge>
            </div>
            <Button>Join Room</Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
