
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FocusSessionHeader from '@/components/focus/FocusSessionHeader';
import FocusSessionContent from '@/components/focus/FocusSessionContent';
import NavigationBar from '@/components/dashboard/NavigationBar';
import { useFocusSession } from '@/hooks/use-focus-session';
import FocusSessionWalkthrough from '@/components/walkthrough/FocusSessionWalkthrough';

const FocusSession = () => {
  const navigate = useNavigate();
  const focusSessionHook = useFocusSession();
  const [isBreak, setIsBreak] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    // Retrieve session data from localStorage or other sources
    const savedSelection = localStorage.getItem('selectedTasksForFocus');
    if (savedSelection) {
      try {
        const parsedData = JSON.parse(savedSelection);
        setSessionData({
          task: {
            title: parsedData.title || 'Focus Session',
            description: parsedData.description || 'Time to focus'
          },
          duration: 25 * 60, // Default to 25 minutes
          goals: parsedData.tasks || []
        });
      } catch (error) {
        console.error("Error loading saved task selections:", error);
        navigate('/dashboard');
      }
    } else {
      // Fallback session data if nothing was selected
      setSessionData({
        task: {
          title: 'Focus Session',
          description: 'Time to focus'
        },
        duration: 25 * 60,
        goals: []
      });
    }
  }, [navigate]);

  const handleEndSession = () => {
    navigate(`/session-reflection`);
  };

  if (!sessionData) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      <div data-walkthrough="focus-header">
        <FocusSessionHeader
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
