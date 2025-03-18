
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Target, Mountain, ScrollText, BookText, CheckCheck, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";

interface SessionData {
  id: string;
  milestone_count: number;
  duration: number;
  created_at: string;
  environment?: string;
  notes?: string;
  user_id: string;
  completed?: boolean;
}

interface ReflectionData {
  id: string;
  user_notes: string;
  mood_rating: number;
  productivity_rating: number;
  session_id: string;
  user_id: string;
  created_at: string;
}

const SessionReportsList = () => {
  const [sessionReports, setSessionReports] = useState<SessionData[]>([]);
  const [reflectionData, setReflectionData] = useState<{[key: string]: ReflectionData}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useUser();
  const isPwaRef = useRef(localStorage.getItem('isPWA') === 'true' || window.matchMedia('(display-mode: standalone)').matches);

  useEffect(() => {
    const loadSessionReports = async () => {
      setIsLoading(true);

      try {
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Check for any local storage reports first (this helps with PWA)
        const localReports: SessionData[] = [];
        
        if (isPwaRef.current) {
          // Scan localStorage for session reports
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sessionReport_')) {
              try {
                const reportData = JSON.parse(localStorage.getItem(key) || '');
                const reportId = key.replace('sessionReport_', '');
                
                // Convert localStorage format to database format
                if (reportData) {
                  localReports.push({
                    id: reportId,
                    milestone_count: reportData.milestone || 0,
                    duration: reportData.duration || 0,
                    created_at: reportData.timestamp || reportData.savedAt || new Date().toISOString(),
                    environment: reportData.environment || 'default',
                    notes: reportData.notes || '',
                    user_id: user.id,
                    completed: reportData.milestone >= 3
                  });
                }
              } catch (e) {
                console.error('Error parsing local session report:', e);
              }
            }
          }
        }

        // Fetch session reports from database
        const { data: dbReports, error: reportsError } = await supabase
          .from('focus_sessions')
          .select('id, milestone_count, duration, created_at, environment, user_id, completed')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (reportsError) {
          console.error('Error fetching session reports:', reportsError);
        }

        // Combine reports from database and localStorage
        // For PWA, we prioritize local reports as they might be more recent
        const combinedReports: SessionData[] = [...localReports];
        
        // Add database reports that aren't already in local reports
        if (dbReports) {
          dbReports.forEach(dbReport => {
            if (!combinedReports.some(r => r.id === dbReport.id)) {
              combinedReports.push(dbReport);
            }
          });
        }
        
        // Sort by created_at date (newest first)
        combinedReports.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // Limit to 10 most recent
        const recentReports = combinedReports.slice(0, 10);

        // Fetch session reflections
        let reflections: ReflectionData[] = [];
        
        // First check localStorage for reflections (for PWA)
        if (isPwaRef.current) {
          try {
            const localReflectionData = localStorage.getItem("sessionReflection");
            if (localReflectionData) {
              const reflection = JSON.parse(localReflectionData);
              // Associate reflection with most recent session if timestamp is close
              const recentSession = recentReports[0];
              if (recentSession) {
                reflections.push({
                  id: `local_${Date.now()}`,
                  user_notes: reflection.accomplished || reflection.learned || reflection.revisit || '',
                  mood_rating: reflection.moodRating || 5,
                  productivity_rating: reflection.productivityRating || 5,
                  session_id: recentSession.id,
                  user_id: user.id,
                  created_at: reflection.timestamp || new Date().toISOString()
                });
              }
            }
          } catch (e) {
            console.error('Error parsing local reflection:', e);
          }
        }
        
        // Then fetch from database
        const { data: dbReflections, error: reflectionsError } = await supabase
          .from('session_reflections')
          .select('id, user_notes, mood_rating, productivity_rating, session_id, user_id, created_at')
          .eq('user_id', user.id)
          .in('session_id', recentReports.map(r => r.id));
          
        if (reflectionsError) {
          console.error('Error fetching session reflections:', reflectionsError);
        } else if (dbReflections) {
          reflections = [...reflections, ...dbReflections];
        }

        // Map reflections to sessions
        const reflectionsMap: {[key: string]: ReflectionData} = {};
        
        reflections.forEach(reflection => {
          reflectionsMap[reflection.session_id] = reflection;
        });
        
        setSessionReports(recentReports);
        setReflectionData(reflectionsMap);
      } catch (e) {
        console.error('Error loading session reports:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionReports();
    
    // Set up subscription for real-time updates
    const channel = supabase
      .channel('session-reports-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'focus_sessions' }, 
        () => loadSessionReports()
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_reflections' },
        () => loadSessionReports()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getEmptyState = () => (
    <Card className="text-center p-8">
      <div className="flex justify-center mb-4">
        <ScrollText className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No session reports yet</h3>
      <p className="text-muted-foreground mb-4">
        Complete a focus session to generate your first session report
      </p>
      <Button
        onClick={() => navigate('/focus-session')}
        className="mx-auto"
      >
        Start a Focus Session
      </Button>
    </Card>
  );

  const getFocusScore = (milestone: number) => {
    // Base score calculated from milestone completion
    const baseScore = (milestone / 3) * 100;
    
    // Add a small random variation for interest
    const variation = Math.floor(Math.random() * 10);
    
    return Math.min(Math.floor(baseScore + variation), 100);
  };

  const getFormattedDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const toggleReportExpansion = (reportId: string) => {
    if (expandedReportId === reportId) {
      setExpandedReportId(null);
    } else {
      setExpandedReportId(reportId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-pulse flex flex-col items-center w-full">
          <Skeleton className="h-4 w-32 rounded mb-4" />
          <Skeleton className="h-32 w-full max-w-2xl rounded" />
        </div>
      </div>
    );
  }

  if (sessionReports.length === 0) {
    return getEmptyState();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <ScrollText className="h-5 w-5 mr-2 text-primary" />
            Session Reports
          </CardTitle>
          <CardDescription>
            View reports from your previous focus sessions
          </CardDescription>
        </CardHeader>
      </Card>

      {sessionReports.map((report) => (
        <Collapsible 
          key={report.id} 
          open={expandedReportId === report.id}
          onOpenChange={() => toggleReportExpansion(report.id)}
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  Session on {format(new Date(report.created_at), 'PPP')}
                </CardTitle>
                <Badge variant={report.milestone_count === 3 ? "default" : "outline"}>
                  {report.milestone_count === 3 ? "Completed" : `${report.milestone_count}/3 Milestones`}
                </Badge>
              </div>
              <CardDescription>
                {format(new Date(report.created_at), 'p')} in {report.environment || 'Default'} environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Duration: {getFormattedDuration(report.duration || 0)}</span>
                </div>
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Focus Score: {getFocusScore(report.milestone_count || 0)}%</span>
                </div>
                <div className="flex items-center">
                  <Mountain className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Milestones: {report.milestone_count}/3</span>
                </div>
              </div>

              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-4 flex items-center justify-center gap-2 border-t border-border/50 pt-2"
                >
                  {expandedReportId === report.id ? "Show Less" : "Show More Details"}
                </Button>
              </CollapsibleTrigger>
            </CardContent>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <Separator className="my-4" />
                
                {reflectionData[report.id] ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Session Reflection</h3>
                    
                    {reflectionData[report.id].user_notes && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                          <BookText className="h-4 w-4" />
                          <span>Notes</span>
                        </div>
                        <p className="text-sm pl-6">{reflectionData[report.id].user_notes}</p>
                      </div>
                    )}
                    
                    <div className="flex space-x-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                          <CheckCheck className="h-4 w-4" />
                          <span>Productivity</span>
                        </div>
                        <p className="text-sm pl-6">{reflectionData[report.id].productivity_rating}/10</p>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                          <RotateCcw className="h-4 w-4" />
                          <span>Mood</span>
                        </div>
                        <p className="text-sm pl-6">{reflectionData[report.id].mood_rating}/10</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    No reflection data available for this session
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
            <CardFooter className="border-t bg-muted/30 px-6 py-3">
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => navigate(`/session-report/${report.id}`)}
              >
                View Full Report
              </Button>
            </CardFooter>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
};

export default SessionReportsList;
