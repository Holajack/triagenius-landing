
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Clock, Target, Trophy } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const SessionReport = () => {
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // For now, using static data. In a real app, this would come from the session state
  const sessionStats = {
    duration: '25:00',
    completed: true,
    focusScore: 85,
  };

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col items-center p-4",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <div className="w-full max-w-2xl space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-2xl font-bold text-center mb-6">
          Session Complete!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 flex flex-col items-center">
            <Clock className="h-8 w-8 mb-2 text-primary" />
            <h3 className="text-lg font-semibold">Session Duration</h3>
            <p className="text-3xl font-mono">{sessionStats.duration}</p>
          </Card>

          <Card className="p-6 flex flex-col items-center">
            <Target className="h-8 w-8 mb-2 text-primary" />
            <h3 className="text-lg font-semibold">Focus Score</h3>
            <p className="text-3xl font-mono">{sessionStats.focusScore}%</p>
          </Card>
        </div>

        <Card className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">
            Congratulations!
          </h3>
          <p className="text-muted-foreground mb-4">
            You've completed your focus session. Keep up the great work!
          </p>
          <Button 
            onClick={() => navigate('/focus-session')}
            className="w-full"
          >
            Start Another Session
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default SessionReport;

