
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Target, Mountain, ScrollText, BookText, CheckCheck, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SessionData {
  id: string;
  milestone: number;
  duration: number;
  timestamp: string;
  environment?: string;
  notes?: string;
  savedAt?: string;
}

interface ReflectionData {
  accomplished: string;
  learned: string;
  revisit: string;
  timestamp: string;
}

const SessionReportsList = () => {
  const [sessionReports, setSessionReports] = useState<SessionData[]>([]);
  const [reflectionData, setReflectionData] = useState<{[key: string]: ReflectionData}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, this would fetch from a database
    // For now, we'll simulate by retrieving from localStorage
    const loadSessionReports = () => {
      setIsLoading(true);

      try {
        // Get all keys from localStorage
        const keys = Object.keys(localStorage);
        const reportKeys = keys.filter(key => key.startsWith('sessionReport_'));
        
        const reports: SessionData[] = [];
        const reflections: {[key: string]: ReflectionData} = {};
        
        // First load all session reports
        reportKeys.forEach(key => {
          try {
            const reportData = JSON.parse(localStorage.getItem(key) || '');
            const id = key.replace('sessionReport_', '');
            reports.push({
              id,
              ...reportData
            });
            
            // Try to find associated reflection data by timestamp
            const reflectionData = localStorage.getItem("sessionReflection");
            if (reflectionData) {
              try {
                const parsedReflection = JSON.parse(reflectionData) as ReflectionData;
                // Use timestamp comparison to associate reflections with reports
                // This is a simple approach - in a real app we'd have proper IDs
                const reportDate = new Date(reportData.timestamp);
                const reflectionDate = new Date(parsedReflection.timestamp);
                
                // If the reflection was created within an hour of the session report,
                // we'll associate them together
                const timeDiff = Math.abs(reportDate.getTime() - reflectionDate.getTime());
                if (timeDiff < 60 * 60 * 1000) { // 1 hour in milliseconds
                  reflections[id] = parsedReflection;
                }
              } catch (e) {
                console.error('Error parsing reflection data:', e);
              }
            }
          } catch (e) {
            console.error('Error parsing session report:', e);
          }
        });
        
        // Sort reports by timestamp (newest first)
        reports.sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        
        setSessionReports(reports);
        setReflectionData(reflections);
      } catch (e) {
        console.error('Error loading session reports:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionReports();
  }, []);

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
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-muted rounded mb-4"></div>
          <div className="h-32 w-full max-w-2xl bg-muted rounded"></div>
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
                  Session on {format(new Date(report.timestamp), 'PPP')}
                </CardTitle>
                <Badge variant={report.milestone === 3 ? "default" : "outline"}>
                  {report.milestone === 3 ? "Completed" : `${report.milestone}/3 Milestones`}
                </Badge>
              </div>
              <CardDescription>
                {format(new Date(report.timestamp), 'p')} in {report.environment || 'Default'} environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Duration: {getFormattedDuration(report.duration)}</span>
                </div>
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Focus Score: {getFocusScore(report.milestone)}%</span>
                </div>
                <div className="flex items-center">
                  <Mountain className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Milestones: {report.milestone}/3</span>
                </div>
              </div>
              
              {report.notes && (
                <div className="mt-2 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Notes:</p>
                  <p className="text-sm">{report.notes}</p>
                </div>
              )}

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
                    
                    {reflectionData[report.id].accomplished && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                          <CheckCheck className="h-4 w-4" />
                          <span>Accomplishments</span>
                        </div>
                        <p className="text-sm pl-6">{reflectionData[report.id].accomplished}</p>
                      </div>
                    )}
                    
                    {reflectionData[report.id].learned && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                          <BookText className="h-4 w-4" />
                          <span>Learnings</span>
                        </div>
                        <p className="text-sm pl-6">{reflectionData[report.id].learned}</p>
                      </div>
                    )}
                    
                    {reflectionData[report.id].revisit && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                          <RotateCcw className="h-4 w-4" />
                          <span>Topics to Revisit</span>
                        </div>
                        <p className="text-sm pl-6">{reflectionData[report.id].revisit}</p>
                      </div>
                    )}
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
