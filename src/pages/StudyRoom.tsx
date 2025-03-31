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

const StudyRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { room, isLoading, error } = useStudyRooms(id || '');
  const { messages, sendMessage, isLoading: isMessagesLoading } = useRoomMessages(id || '');
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [isFocusDialogOpen, setIsFocusDialogOpen] = useState(false);
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25 * 60); // Default to 25 minutes
  const timerRef = useRef<{ stopTimer: () => void; setRemainingTime?: (time: number) => void; getRemainingTime?: () => number } | null>(null);
  const [remainingTime, setRemainingTime] = useState(timerDuration);

  useEffect(() => {
    if (room && room.timer_duration) {
      setTimerDuration(room.timer_duration * 60);
      setRemainingTime(room.timer_duration * 60);
    }
  }, [room]);

  const handleSendMessage = async () => {
    if (message.trim() && id) {
      await sendMessage(id, message.trim());
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

  const handleCloseFocusDialog = () => {
    setIsFocusDialogOpen(false);
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

  if (isLoading) {
    return <div>Loading study room...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!room) {
    return <div>Study room not found.</div>;
  }

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col p-4",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <PageHeader title={room.name} />
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
            messages={messages}
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
        onClose={handleCloseFocusDialog}
        onConfirm={handleConfirmFocus}
      />
    </div>
  );
};

export default StudyRoom;
