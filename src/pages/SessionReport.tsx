
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Clock, Target, Trophy, Calendar, Mountain, Edit3 } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import PageHeader from '@/components/common/PageHeader';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

interface SessionData {
  milestone: number;
  duration: number;
  timestamp: string;
  environment?: string;
}

const SessionReport = () => {
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    // Retrieve session data from localStorage
    const storedData = localStorage.getItem('sessionData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setSessionData(data);
      } catch (e) {
        console.error('Error parsing session data', e);
      }
    }
  }, []);

  // Calculate stats based on milestone reached
  const getFocusScore = () => {
    if (!sessionData) return 0;
    
    // Base score calculated from milestone completion
    const baseScore = (sessionData.milestone / 3) * 100;
    
    // Add a small random variation for interest
    const variation = Math.floor(Math.random() * 10);
    
    return Math.min(Math.floor(baseScore + variation), 100);
  };
  
  const getSessionTime = () => {
    if (!sessionData) return '00:00';
    
    const hours = Math.floor(sessionData.duration / 60);
    const minutes = sessionData.duration % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  const handleSaveNotes = () => {
    // In a real app, this would save to a database
    console.log('Saving notes:', sessionNotes);
    // Clear the session data from localStorage
    localStorage.removeItem('sessionData');
    navigate('/dashboard');
  };

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col items-center p-4",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <div className="w-full max-w-3xl space-y-6">
        <PageHeader title="Session Complete!" />
        
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 flex flex-col items-center">
            <Clock className="h-8 w-8 mb-2 text-primary" />
            <h3 className="text-lg font-semibold">Session Duration</h3>
            <p className="text-3xl font-mono">{getSessionTime()}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {sessionData?.milestone === 3 
                ? "Full session completed!" 
                : `Completed ${sessionData?.milestone || 0} of 3 milestones`}
            </p>
          </Card>

          <Card className="p-6 flex flex-col items-center">
            <Target className="h-8 w-8 mb-2 text-primary" />
            <h3 className="text-lg font-semibold">Focus Score</h3>
            <p className="text-3xl font-mono">{getFocusScore()}%</p>
            <div className="w-full mt-2">
              <Progress value={getFocusScore()} className="h-2" />
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {sessionData?.timestamp 
                  ? format(new Date(sessionData.timestamp), 'PPP') 
                  : format(new Date(), 'PPP')}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Environment</span>
              <span className="font-medium capitalize">
                {sessionData?.environment || state.environment || 'Default'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Milestones Reached</span>
              <div className="flex items-center">
                <span className="font-medium mr-2">{sessionData?.milestone || 0}/3</span>
                <Mountain className="h-4 w-4 text-primary" />
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <Edit3 className="h-4 w-4 mr-2" />
                <h4 className="font-medium">Session Notes</h4>
              </div>
              <Textarea 
                placeholder="Record your thoughts about this focus session..."
                className="min-h-[100px]"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">
            {sessionData?.milestone === 3 
              ? "Congratulations on completing your focus session!" 
              : "Great effort on your focus session!"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {sessionData?.milestone === 3 
              ? "You've reached all milestones. Keep up the excellent work!" 
              : "Even partial focus sessions help build your concentration skills."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <Button 
              onClick={handleSaveNotes}
              className="w-full sm:w-auto"
              variant="default"
            >
              Save Notes & Finish
            </Button>
            
            <Button 
              onClick={() => navigate('/focus-session')}
              className="w-full sm:w-auto"
              variant="outline"
            >
              Start Another Session
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SessionReport;
