import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FocusSessionHeader from '@/components/focus/FocusSessionHeader';
import FocusSessionContent from '@/components/focus/FocusSessionContent';
import NavigationBar from '@/components/dashboard/NavigationBar';
import { useFocusSession } from '@/hooks/use-focus-session';
import FocusSessionWalkthrough from '@/components/walkthrough/FocusSessionWalkthrough';

const FocusSession = () => {
  const navigate = useNavigate();
  const { sessionData, startSession, endSession, breakTime, setBreakTime } = useFocusSession();
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    if (!sessionData) {
      navigate('/dashboard');
    }
  }, [sessionData, navigate]);

  const handleEndSession = () => {
    endSession();
    navigate(`/session-reflection`);
  };

  if (!sessionData) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      <div data-walkthrough="focus-header">
        <FocusSessionHeader
          title={sessionData.task?.title || 'Focus Session'}
          description={sessionData.task?.description || 'Time to focus'}
          onEndSession={handleEndSession}
        />
      </div>
      
      <div className="flex-grow flex flex-col">
        <FocusSessionContent 
          sessionData={sessionData}
          onEndSession={handleEndSession}
          data-walkthrough="focus-content"
        />
      </div>
      
      <div data-walkthrough="navigation-bar">
        <NavigationBar />
      </div>
      
      <FocusSessionWalkthrough />
    </div>
  );
};

export default FocusSession;
