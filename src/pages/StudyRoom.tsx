
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useStudyRooms } from '@/hooks/use-study-rooms';
import { useRoomMessages } from '@/hooks/use-room-messages';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StudyRoomChat } from '@/components/studyroom/StudyRoomChat';
import { StudyRoomMember } from '@/components/studyroom/StudyRoomMember';
import { StudyRoomResources } from '@/components/studyroom/StudyRoomResources';
import { StartFocusDialog } from '@/components/studyroom/StartFocusDialog';
import PageHeader from '@/components/common/PageHeader';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import FocusTimer from "@/components/focus/FocusTimer";
import { Check, Clock, X } from 'lucide-react';
import { useFocusSession } from "@/hooks/use-focus-session";

// Define a proper interface for the StudyRoom
interface StudyRoom {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  created_at: string;
  current_participants?: number;
  timer_duration?: number;
}

const StudyRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rooms, loading: isRoomsLoading, error: roomError } = useStudyRooms();
  
  // Safely cast found room to our defined StudyRoom interface
  const foundRoom = rooms.find(room => room.id === id);
  const currentRoom = foundRoom ? {
    id: foundRoom.id,
    name: foundRoom.name,
    description: foundRoom.description,
    creator_id: foundRoom.creator_id,
    created_at: foundRoom.created_at,
    current_participants: foundRoom.current_participants,
    timer_duration: foundRoom.duration ? parseInt(foundRoom.duration) : 25 // Default to 25 if not set
  } as StudyRoom : undefined;
  
  const { messages, sendMessage, loading: isMessagesLoading } = useRoomMessages(id || '');
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [isFocusDialogOpen, setIsFocusDialogOpen] = useState(false);
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25 * 60);
  const timerRef = useRef<{ stopTimer: () => void; setRemainingTime: (time: number) => void } | null>(null);
  const [remainingTime, setRemainingTime] = useState(timerDuration);

  useEffect(() => {
    if (currentRoom && currentRoom.timer_duration) {
      setTimerDuration(currentRoom.timer_duration * 60);
      setRemainingTime(currentRoom.timer_duration * 60);
    }
  }, [currentRoom]);

  const handleSendMessage = async () => {
    if (message.trim() && id) {
      await sendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartFocus = () => {
    setIsFocusDialogOpen(true);
  };

  const handleConfirmFocus = (duration: number) => {
    setTimerDuration(duration * 60);
    setRemainingTime(duration * 60);
    setIsTimerActive(true);
    setIsFocusDialogOpen(false);
  };

  const handleTimerComplete = () => {
    setIsTimerActive(false);
    alert('Focus session complete!');
  };

  const handleTimerPause = () => {
    setIsTimerActive(false);
  };

  const handleTimerResume = () => {
    setIsTimerActive(true);
  };

  const handleLeaveRoom = () => {
    navigate('/dashboard');
  };

  if (isRoomsLoading) {
    return <div>Loading study room...</div>;
  }

  if (roomError) {
    return <div>Error: {roomError.message}</div>;
  }

  if (!currentRoom) {
    return <div>Study room not found.</div>;
  }

  // Convert RoomMessage[] to the format expected by StudyRoomChat
  const formattedMessages = messages.map(msg => ({
    id: msg.id,
    room_id: msg.room_id || '',
    user_id: msg.sender_id,
    content: msg.content,
    created_at: msg.created_at,
    sender: msg.sender
  }));

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col p-4",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <PageHeader title={currentRoom.name} />
      <div className="flex justify-between items-center mb-4">
        <Button onClick={handleLeaveRoom} variant="ghost">
          <X className="w-4 h-4 mr-2" />
          Leave Room
        </Button>
        <Button onClick={handleStartFocus}>
          <Clock className="w-4 h-4 mr-2" />
          Start Focus Session
        </Button>
      </div>

      <div className="flex flex-col md:flex-row h-full">
        <div className="w-full md:w-3/4 flex flex-col">
          <StudyRoomChat
            messages={formattedMessages}
            isLoading={isMessagesLoading}
            message={message}
            setMessage={setMessage}
            onSendMessage={handleSendMessage}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="w-full md:w-1/4 flex flex-col">
          <StudyRoomMember roomId={id || ''} />
          <StudyRoomResources roomId={id || ''} />
        </div>
      </div>

      <StartFocusDialog
        open={isFocusDialogOpen}
        onOpenChange={setIsFocusDialogOpen}
        onConfirm={handleConfirmFocus}
      />
    </div>
  );
};

export default StudyRoom;
