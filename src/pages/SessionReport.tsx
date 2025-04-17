
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Clock, Target, Trophy, Calendar, Mountain, Edit3, BookText, CheckCheck, RotateCcw, Music, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useSoundPlayback } from '@/hooks/use-sound-playback';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PageHeader from '@/components/common/PageHeader';

interface SessionData {
  milestone: number;
  duration: number;
  timestamp: string;
  environment?: string;
  notes?: string;
  completed?: boolean;
}

interface ReflectionData {
  accomplished: string;
  learned: string;
  revisit: string;
  timestamp: string;
  moodRating?: number;
  productivityRating?: number;
}

const SessionReport = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { state } = useOnboarding();
  const { user } = useUser();
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSoundControls, setShowSoundControls] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [reflectionData, setReflectionData] = useState<ReflectionData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Initialize sound playback
  const { 
    isPlaying,
    currentTrack, 
    volume,
    setVolume,
    togglePlay,
    stopPlayback
  } = useSoundPlayback({
    autoPlay: true,
    volume: 0.3,
    enabled: state.soundPreference !== 'silence'
  });
  
  useEffect(() => {
    const loadSessionData = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        if (sessionId) {
          const reportKey = `sessionReport_${sessionId}`;
          const localReportData = localStorage.getItem(reportKey);
          
          if (localReportData) {
            try {
              const data = JSON.parse(localReportData);
              setSessionData(data);
              setSessionNotes(data.notes || '');
            } catch (e) {
              console.error('Error parsing local session report data', e);
              setLoadError('Could not load session data. It may be corrupted.');
            }
          } else if (user?.id) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
            
            if (isUuid) {
              const { data: dbSession, error } = await supabase
                .from('focus_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();
                
              if (error) {
                throw error;
              } else if (dbSession) {
                let sessionNotes = '';
                try {
                  const notesKey = `sessionNotes_${sessionId}`;
                  const storedNotes = localStorage.getItem(notesKey);
                  if (storedNotes) {
                    sessionNotes = storedNotes;
                  }
                } catch (e) {
                  console.error('Error retrieving notes from localStorage:', e);
                }
                
                setSessionData({
                  milestone: dbSession.milestone_count || 0,
                  duration: dbSession.duration || 0,
                  timestamp: dbSession.created_at,
                  environment: dbSession.environment || 'default',
                  notes: sessionNotes,
                  completed: dbSession.completed
                });
                setSessionNotes(sessionNotes);
              } else {
                throw new Error("Session not found");
              }
            } else {
              const matchingKey = Object.keys(localStorage).find(key => 
                key.startsWith('sessionReport_') && key.includes(sessionId)
              );
              
              if (matchingKey) {
                try {
                  const matchingData = JSON.parse(localStorage.getItem(matchingKey) || '');
                  setSessionData(matchingData);
                  setSessionNotes(matchingData.notes || '');
                } catch (err) {
                  throw new Error("Invalid session data format");
                }
              } else {
                throw new Error("Session not found");
              }
            }
          } else {
            const fuzzyMatchKey = Object.keys(localStorage).find(key => 
              key.startsWith('sessionReport_') && (
                key.includes(sessionId.substring(0, 8)) || 
                sessionId.includes(key.split('_')[1]?.substring(0, 8) || '')
              )
            );
            
            if (fuzzyMatchKey) {
              try {
                const fuzzyData = JSON.parse(localStorage.getItem(fuzzyMatchKey) || '');
                setSessionData(fuzzyData);
                setSessionNotes(fuzzyData.notes || '');
              } catch (e) {
                toast.error("Session report not found");
                setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
              }
            } else {
              toast.error("Session report not found");
              setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
            }
          }
        } else {
          const storedData = localStorage.getItem('sessionData');
          if (storedData) {
            try {
              const data = JSON.parse(storedData);
              setSessionData(data);
              
              let id;
              if (crypto.randomUUID) {
                id = crypto.randomUUID();
              } else {
                id = `session-${Date.now()}`;
              }
            } catch (e) {
              console.error('Error parsing session data', e);
              setLoadError('Could not load session data');
            }
          } else {
            toast.error("No session data found");
            setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
          }
        }
        
        const reflectionData = localStorage.getItem("sessionReflection");
        if (reflectionData) {
          try {
            setReflectionData(JSON.parse(reflectionData));
          } catch (e) {
            console.error('Error parsing reflection data', e);
          }
        }
      } catch (e) {
        console.error('Error loading session report:', e);
        setLoadError('Could not load session report');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSessionData();
  }, [sessionId, navigate, user]);

  const getFocusScore = () => {
    if (!sessionData) return null;
    
    let baseScore = Math.min((sessionData.milestone / 3) * 100, 100);
    
    const variation = Math.floor(Math.random() * 5) + 1;
    
    if (sessionData.completed || sessionData.milestone >= 3) {
      baseScore = Math.max(baseScore, 85);
    }
    
    return Math.min(Math.floor(baseScore + variation), 100);
  };
  
  const getSessionTime = () => {
    if (!sessionData) return '00:00';
    
    const duration = sessionData.duration || 0;
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  const handleSaveNotes = async () => {
    if (sessionData) {
      if (sessionId) {
        const reportKey = `sessionReport_${sessionId}`;
        const notesKey = `sessionNotes_${sessionId}`;
        
        localStorage.setItem(notesKey, sessionNotes);
        
        const currentReportData = localStorage.getItem(reportKey);
        if (currentReportData) {
          try {
            const currentData = JSON.parse(currentReportData);
            const updatedData = {
              ...currentData,
              notes: sessionNotes,
              lastEdited: new Date().toISOString()
            };
            localStorage.setItem(reportKey, JSON.stringify(updatedData));
          } catch (e) {
            console.error('Error updating report data in localStorage:', e);
          }
        }
        
        setIsEditing(false);
      } else {
        const reportId = sessionId || `session_${Date.now()}`;
        const reportKey = `sessionReport_${reportId}`;
        const notesKey = `sessionNotes_${reportId}`;
        
        localStorage.setItem(notesKey, sessionNotes);
        
        const reportData = {
          ...sessionData,
          notes: sessionNotes,
          savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(reportKey, JSON.stringify(reportData));
        
        if (user?.id) {
          try {
            await supabase.from('focus_sessions').upsert({
              id: reportId,
              user_id: user.id,
              milestone_count: sessionData.milestone || 0,
              duration: sessionData.duration || 0,
              created_at: sessionData.timestamp || new Date().toISOString(),
              environment: sessionData.environment || 'default',
              completed: sessionData.milestone >= 3
            });
          } catch (e) {
            console.error('Error saving session to database:', e);
          }
        }
        
        localStorage.removeItem('sessionData');
        
        navigate('/reports', { replace: true });
      }
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleBackToDashboard = () => {
    if (sessionId) {
      navigate('/reports', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen bg-background text-foreground flex flex-col items-center p-4",
        `theme-${state.environment || 'default'} ${theme}`
      )}>
        <div className="w-full max-w-3xl space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-40 bg-muted rounded"></div>
          <div className="h-40 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn(
        "min-h-screen bg-background text-foreground flex flex-col items-center p-4",
        `theme-${state.environment || 'default'} ${theme}`
      )}>
        <div className="w-full max-w-3xl">
          <PageHeader title="Error Loading Report" subtitle="" />
          <Card className="p-6 text-center">
            <div className="text-red-500 mb-4">{loadError}</div>
            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </Card>
        </div>
      </div>
    );
  }

  const focusScore = getFocusScore();

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground py-4 px-4 sm:px-6",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="mr-2 h-9 w-9"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-semibold">Session Review</h1>
          </div>
          
          {state.soundPreference !== 'silence' && (
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowSoundControls(!showSoundControls)}
              >
                <Music className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {showSoundControls && (
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={togglePlay}
                  >
                    {isPlaying ? 
                      <Pause className="h-4 w-4" /> : 
                      <Play className="h-4 w-4" />
                    }
                  </Button>
                  
                  <div className="ml-2">
                    <p className="text-sm font-medium line-clamp-1">
                      {currentTrack?.title || 'No track playing'}
                    </p>
                    {currentTrack?.artist && (
                      <p className="text-xs text-muted-foreground">
                        {currentTrack.artist}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <Slider
                    className="w-24"
                    value={[volume * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVolume(value[0] / 100)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="mb-6">
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
            
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">
                {sessionData?.completed || sessionData?.milestone === 3 
                  ? "Completed" 
                  : "Ended Early"}
              </span>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Edit3 className="h-4 w-4 mr-2" />
                  <h4 className="font-medium">Session Notes</h4>
                </div>
                {sessionId && !isEditing && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
              {isEditing || !sessionId ? (
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
              
              {(reflectionData.moodRating || reflectionData.productivityRating) && (
                <div className="flex space-x-4">
                  {reflectionData.productivityRating && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <CheckCheck className="h-4 w-4" />
                        <span>Productivity</span>
                      </div>
                      <p className="text-sm pl-6">{reflectionData.productivityRating}/10</p>
                    </div>
                  )}
                  
                  {reflectionData.moodRating && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <RotateCcw className="h-4 w-4" />
                        <span>Mood</span>
                      </div>
                      <p className="text-sm pl-6">{reflectionData.moodRating}/10</p>
                    </div>
                  )}
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
            {isEditing || !sessionId ? (
              <Button 
                onClick={handleSaveNotes}
                className="w-full sm:w-auto"
                variant="default"
              >
                {sessionId ? "Save Changes" : "Save Notes & Finish"}
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
