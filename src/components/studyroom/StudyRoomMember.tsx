
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface Participant {
  id: number;
  name: string;
  avatar: string;
  online: boolean;
  role: string;
}

interface StudyRoomMemberProps {
  participants: Participant[];
}

export const StudyRoomMember = ({ participants }: StudyRoomMemberProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Room Participants ({participants.length})</h3>
      
      <div className="space-y-3">
        {participants.map((participant) => (
          <Card key={participant.id} className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback>{participant.name[0]}</AvatarFallback>
                </Avatar>
                {participant.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{participant.name}</h4>
                  {participant.role === "organizer" && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Crown className="h-3 w-3" />
                      Organizer
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {participant.online ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
