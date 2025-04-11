
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useStudyRooms } from '@/hooks/use-study-rooms';
import { useRoomMessages } from '@/hooks/use-room-messages';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { StudyRoomChat } from '@/components/studyroom/StudyRoomChat';
import { StudyRoomMember } from '@/components/studyroom/StudyRoomMember';
import { StudyRoomResources } from '@/components/studyroom/StudyRoomResources';
import { StartFocusDialog } from '@/components/studyroom/StartFocusDialog';
import PageHeader from '@/components/common/PageHeader';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Clock, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKeyboardVisibility } from '@/hooks/use-keyboard-visibility';

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
  const isMobile = useIsMobile();
  
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
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { isKeyboardVisible } = useKeyboardVisibility({
    debounceTime: 150
  });

  useEffect(() => {
    // Set viewport height custom property
    const updateVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    updateVh();
    window.addEventListener('resize', updateVh);
    window.addEventListener('orientationchange', updateVh);
    
    return () => {
      window.removeEventListener('resize', updateVh);
      window.removeEventListener('orientationchange', updateVh);
    };
  }, []);

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
    // Focus session start logic
    setIsFocusDialogOpen(false);
  };

  const handleLeaveRoom = () => {
    navigate('/dashboard');
  };

  if (isRoomsLoading) {
    return <div className="flex justify-center items-center h-screen">Loading study room...</div>;
  }

  if (roomError) {
    return <div className="flex justify-center items-center h-screen">Error: {roomError.message}</div>;
  }

  if (!currentRoom) {
    return <div className="flex justify-center items-center h-screen">Study room not found.</div>;
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
    <div 
      ref={containerRef}
      className={cn(
        "min-h-screen bg-background text-foreground flex flex-col p-4",
        `theme-${state.environment || 'default'} ${theme}`
      )}
      style={{
        minHeight: isMobile ? 'calc(var(--vh, 1vh) * 100)' : '100vh',
        height: isMobile ? 'calc(var(--vh, 1vh) * 100)' : '100vh',
        paddingBottom: isKeyboardVisible && isMobile ? '0' : undefined,
        overflow: 'hidden'
      }}
    >
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

      <div className={cn(
        "flex flex-col md:flex-row flex-1 h-full overflow-hidden",
        isKeyboardVisible && isMobile ? "pb-0" : ""
      )}>
        <div className="w-full md:w-3/4 flex flex-col mb-4 md:mb-0 max-h-full">
          <StudyRoomChat
            messages={formattedMessages}
            isLoading={isMessagesLoading}
            message={message}
            setMessage={setMessage}
            onSendMessage={handleSendMessage}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={cn(
          "w-full md:w-1/4 flex flex-col",
          isKeyboardVisible && isMobile ? "hidden" : ""
        )}>
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
