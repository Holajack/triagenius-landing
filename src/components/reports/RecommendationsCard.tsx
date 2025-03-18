
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Brain, Book, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Recommendation {
  type: string;
  message: string;
  icon: JSX.Element;
}

interface FocusArea {
  name: string;
  color: string;
  bgColor: string;
}

const RecommendationsCard = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateRecommendations = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get user's focus sessions
        const { data: sessions } = await supabase
          .from('focus_sessions')
          .select('duration, milestone_count, environment, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        // If we don't have enough data, use fallback recommendations
        if (!sessions || sessions.length < 3) {
          setDefaultRecommendations();
          return;
        }

        // Calculate session patterns
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.milestone_count === 3).length;
        const completionRate = completedSessions / totalSessions;
        const avgDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions;
        
        // Check for late night study sessions
        const lateNightSessions = sessions.filter(s => {
          const date = new Date(s.created_at);
          const hour = date.getHours();
          return hour >= 22 || hour <= 4;
        }).length;
        
        // Generate recommendations based on patterns
        const newRecommendations: Recommendation[] = [];
        
        // Recommendation based on completion rate
        if (completionRate < 0.7) {
          newRecommendations.push({
            type: "focus",
            message: "Try breaking your focus sessions into smaller chunks to improve completion rate.",
            icon: <Target className="h-5 w-5 text-primary" />,
          });
        } else if (sessions.length >= 5) {
          newRecommendations.push({
            type: "achievement",
            message: "Great job maintaining a high completion rate! Consider increasing session difficulty.",
            icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
          });
        }
        
        // Recommendation based on session duration
        if (avgDuration > 90) {
          newRecommendations.push({
            type: "warning",
            message: "Your sessions average over 90 minutes. Consider more breaks to prevent burnout.",
            icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          });
        } else if (avgDuration < 30) {
          newRecommendations.push({
            type: "optimization",
            message: "Your sessions are short. Try extending them to 30-45 minutes for deeper focus.",
            icon: <Clock className="h-5 w-5 text-blue-500" />,
          });
        }
        
        // Recommendation based on late night sessions
        if (lateNightSessions > 2) {
          newRecommendations.push({
            type: "health",
            message: "You have several late night study sessions. Consider adjusting your schedule for better rest.",
            icon: <Moon className="h-5 w-5 text-indigo-500" />,
          });
        }
        
        // Recommendation based on environment preference
        const environments = sessions.map(s => s.environment);
        const uniqueEnvironments = [...new Set(environments)].filter(Boolean);
        
        if (uniqueEnvironments.length <= 1) {
          newRecommendations.push({
            type: "variety",
            message: "Try varying your study environments to stimulate different cognitive patterns.",
            icon: <Brain className="h-5 w-5 text-purple-500" />,
          });
        }
        
        // Add learning technique recommendation
        newRecommendations.push({
          type: "learning",
          message: "Incorporate spaced repetition techniques to improve memory retention and recall.",
          icon: <Book className="h-5 w-5 text-green-500" />,
        });
        
        // If we still need more recommendations, add default ones
        while (newRecommendations.length < 4) {
          newRecommendations.push({
            type: "balance",
            message: "Balance focused work with creative activities to enhance overall cognitive function.",
            icon: <Brain className="h-5 w-5 text-primary" />,
          });
        }
        
        // Take only the first 4 recommendations
        setRecommendations(newRecommendations.slice(0, 4));
        
        // Generate focus areas based on patterns
        const newFocusAreas: FocusArea[] = [
          {
            name: "Memory",
            color: "blue-800",
            bgColor: "blue-100",
          },
          {
            name: "Creativity",
            color: "yellow-800",
            bgColor: "yellow-100",
          },
          {
            name: "Analytical",
            color: "blue-800",
            bgColor: "blue-100",
          },
          {
            name: "Critical Thinking",
            color: "green-800",
            bgColor: "green-100",
          }
        ];
        
        setFocusAreas(newFocusAreas);
      } catch (error) {
        console.error('Error generating recommendations:', error);
        setDefaultRecommendations();
      } finally {
        setIsLoading(false);
      }
    };
    
    const setDefaultRecommendations = () => {
      // Default recommendations when no data is available
      setRecommendations([
        {
          type: "balance",
          message: "Consider adding more creative activities to balance your cognitive workload.",
          icon: <Brain className="h-5 w-5 text-primary" />,
        },
        {
          type: "optimization",
          message: "Schedule complex tasks during your peak productivity hours for better results.",
          icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
        },
        {
          type: "learning",
          message: "Try spaced repetition techniques to improve your memory retention scores.",
          icon: <Book className="h-5 w-5 text-green-500" />,
        },
        {
          type: "warning",
          message: "Remember to take regular breaks during extended study sessions to prevent burnout.",
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        },
      ]);
      
      setFocusAreas([
        {
          name: "Creativity",
          color: "yellow-800",
          bgColor: "yellow-100",
        },
        {
          name: "Analytical",
          color: "blue-800",
          bgColor: "blue-100",
        },
        {
          name: "Memory",
          color: "purple-800",
          bgColor: "purple-100",
        },
        {
          name: "Critical Thinking",
          color: "green-800",
          bgColor: "green-100",
        },
      ]);
    };

    generateRecommendations();
    
    // Refresh recommendations periodically
    const interval = setInterval(() => {
      generateRecommendations();
    }, 30 * 60 * 1000); // every 30 minutes
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            
            <div className="mt-6 pt-4 border-t border-border">
              <Skeleton className="h-4 w-36 rounded mb-2" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-8 w-full rounded" />
                <Skeleton className="h-8 w-full rounded" />
                <Skeleton className="h-8 w-full rounded" />
                <Skeleton className="h-8 w-full rounded" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-primary" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="flex gap-3 p-3 rounded-lg border bg-background/50">
              <div className="mt-0.5">{recommendation.icon}</div>
              <div>
                <p className="text-sm">{recommendation.message}</p>
              </div>
            </div>
          ))}
          
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-2">Suggested Focus Areas:</h4>
            <div className="grid grid-cols-2 gap-2">
              {focusAreas.map((area, index) => (
                <div key={index} className={`text-xs p-2 bg-${area.bgColor} text-${area.color} rounded flex items-center gap-1`}>
                  <div className={`w-2 h-2 rounded-full bg-${area.color.split('-')[0]}-500`}></div>
                  {area.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationsCard;

// Helper components for icons
const Target = (props: any) => <div {...props}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>;
const Clock = (props: any) => <div {...props}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>;
const Moon = (props: any) => <div {...props}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></div>;
