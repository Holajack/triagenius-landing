
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Clock, Target, Trophy, Calendar, Mountain, Edit3, BookText, CheckCheck, RotateCcw } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import PageHeader from '@/components/common/PageHeader';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface SessionData {
  milestone: number;
  duration: number;
  timestamp: string;
  environment?: string;
  notes?: string;
}

interface ReflectionData {
  accomplished: string;
  learned: string;
  revisit: string;
  timestamp: string;
}

const SessionReport = () => {
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const params = useParams();
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [reflectionData, setReflectionData] = useState<ReflectionData | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Check if we're viewing an existing report or a new one
    if (params.id) {
      // We're viewing an existing report
      const reportKey = `sessionReport_${params.id}`;
      const reportData = localStorage.getItem(reportKey);

      if (reportData) {
        try {
          const data = JSON.parse(reportData);
          setSessionData(data);
          setSessionNotes(data.notes || '');
          setSessionId(params.id);
          
          // Try to find associated reflection data by timestamp
          const reflectionData = localStorage.getItem("sessionReflection");
          if (reflectionData) {
            try {
              const parsedReflection = JSON.parse(reflectionData) as ReflectionData;
              
              // Use timestamp comparison to associate reflections with reports
              const reportDate = new Date(data.timestamp);
              const reflectionDate = new Date(parsedReflection.timestamp);
              
              // If the reflection was created within an hour of the session report,
              // we'll associate them together
              const timeDiff = Math.abs(reportDate.getTime() - reflectionDate.getTime());
              if (timeDiff < 60 * 60 * 1000) { // 1 hour in milliseconds
                setReflectionData(parsedReflection);
              }
            } catch (e) {
              console.error('Error parsing reflection data:', e);
            }
          }
        } catch (e) {
          console.error('Error parsing session report data', e);
        }
      } else {
        // Report not found, redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    } else {
      // Retrieve session data from localStorage for a new report
      const storedData = localStorage.getItem('sessionData');
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          setSessionData(data);
          
          // Generate a unique ID for this session
          const id = `session_${Date.now()}`;
          setSessionId(id);
          
          // Check for reflection data
          const reflectionData = localStorage.getItem("sessionReflection");
          if (reflectionData) {
            try {
              setReflectionData(JSON.parse(reflectionData));
            } catch (e) {
              console.error('Error parsing reflection data', e);
            }
          }
        } catch (e) {
          console.error('Error parsing session data', e);
        }
      }
    }
  }, [params.id, navigate]);

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
    if (sessionData) {
      if (params.id) {
        // Update existing report
        const reportKey = `sessionReport_${params.id}`;
        const currentData = JSON.parse(localStorage.getItem(reportKey) || '{}');
        const updatedData = {
          ...currentData,
          notes: sessionNotes,
          lastEdited: new Date().toISOString()
        };
        localStorage.setItem(reportKey, JSON.stringify(updatedData));
        setIsEditing(false);
      } else {
        // Save the session report to localStorage with a unique key
        const reportKey = `sessionReport_${Date.now()}`;
        const reportData = {
          ...sessionData,
          notes: sessionNotes,
          savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(reportKey, JSON.stringify(reportData));
        
        // Clear the session data from localStorage
        localStorage.removeItem('sessionData');
        
        // Navigate to reports page after saving
        navigate('/reports', { replace: true });
      }
    } else {
      // If no session data, just go back to dashboard
      navigate('/dashboard', { replace: true });
    }
  };

  const handleBackToDashboard = () => {
    if (params.id) {
      // If viewing an existing report, go back to reports page
      navigate('/reports', { replace: true });
    } else {
      // If this is a new report, go to dashboard
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col items-center p-4",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <div className="w-full max-w-3xl space-y-6">
        <PageHeader title={params.id ? "Session Report" : "Session Complete!"} />
        
        <Button 
          variant="ghost" 
          onClick={handleBackToDashboard}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {params.id ? "Back to Reports" : "Back to Dashboard"}
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Edit3 className="h-4 w-4 mr-2" />
                  <h4 className="font-medium">Session Notes</h4>
                </div>
                {params.id && !isEditing && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
              {isEditing || !params.id ? (
                <Textarea 
                  placeholder="Record your thoughts about this focus session..."
                  className="min-h-[100px]"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                />
              ) : (
                <div className="p-3 bg-muted/50 rounded-md min-h-[100px]">
                  {sessionData?.notes ? (
                    <p className="text-sm">{sessionData.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes recorded for this session.</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {reflectionData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookText className="h-5 w-5 mr-2" />
                Session Reflection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reflectionData.accomplished && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCheck className="h-4 w-4 mr-2 text-primary" />
                    <h4 className="font-medium">What was accomplished</h4>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm">{reflectionData.accomplished}</p>
                  </div>
                </div>
              )}
              
              {reflectionData.learned && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <BookText className="h-4 w-4 mr-2 text-primary" />
                    <h4 className="font-medium">What was learned</h4>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm">{reflectionData.learned}</p>
                  </div>
                </div>
              )}
              
              {reflectionData.revisit && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <RotateCcw className="h-4 w-4 mr-2 text-primary" />
                    <h4 className="font-medium">Topics to revisit</h4>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm">{reflectionData.revisit}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
            {isEditing || !params.id ? (
              <Button 
                onClick={handleSaveNotes}
                className="w-full sm:w-auto"
                variant="default"
              >
                {params.id ? "Save Changes" : "Save Notes & Finish"}
              </Button>
            ) : null}
            
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
