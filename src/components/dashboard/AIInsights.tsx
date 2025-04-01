
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { BrainCircuit, Clock, Lightbulb, Sparkles, TrendingUp, RefreshCw, ExternalLink, Users, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Insight {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    route: string;
    params?: Record<string, string>;
    tab?: string;
  };
}

const AIInsights = () => {
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Check if the user has any focus session data and fetch insights
  useEffect(() => {
    const checkForFocusDataAndFetchInsights = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { count } = await supabase
            .from('focus_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
            
          const hasExistingData = count !== null && count > 0;
          setHasData(hasExistingData);
          
          // Fetch insights using the edge function
          await fetchInsights(user.id, hasExistingData);
        }
      } catch (error) {
        console.error('Error checking for focus data:', error);
        setDefaultInsights();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkForFocusDataAndFetchInsights();
  }, []);
  
  const fetchInsights = async (userId: string, hasExistingData: boolean) => {
    if (!hasExistingData) {
      setDefaultInsights();
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      // Call the edge function to generate insights (now using Groq)
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { userId }
      });
      
      if (error) {
        console.error('Error invoking generate-insights:', error);
        setDefaultInsights();
        return;
      }
      
      if (data.error) {
        console.error('Error from generate-insights:', data.error);
        setDefaultInsights();
        return;
      }
      
      // Process insights and add icons and actions
      const processedInsights = data.insights.map((insight: Insight, index: number) => {
        let icon;
        let action;
        
        // Assign icons based on index for variety
        switch (index % 4) {
          case 0:
            icon = <Clock className={`w-5 h-5 ${getAccentColor()}`} />;
            action = {
              label: "Start now",
              route: "/focus-session"
            };
            break;
          case 1:
            icon = <TrendingUp className={`w-5 h-5 ${getAccentColor()}`} />;
            action = {
              label: "View trends",
              route: "/reports"
            };
            break;
          case 2:
            icon = <BrainCircuit className={`w-5 h-5 ${getAccentColor()}`} />;
            action = {
              label: "Set preferences",
              route: "/profile"
            };
            break;
          case 3:
            icon = <Users className={`w-5 h-5 ${getAccentColor()}`} />;
            action = {
              label: "Find friends",
              route: "/community",
              tab: "friends"
            };
            break;
        }
        
        // Match keywords in insight titles to determine appropriate actions
        const title = insight.title.toLowerCase();
        const description = insight.description.toLowerCase();
        const fullText = title + " " + description;
        
        if (fullText.includes("accountability") || fullText.includes("partner") || 
            fullText.includes("friend") || fullText.includes("social")) {
          action = {
            label: "Find partners",
            route: "/community",
            tab: "friends"
          };
          icon = <Users className={`w-5 h-5 ${getAccentColor()}`} />;
        } else if (fullText.includes("goal") || fullText.includes("target") || 
                  fullText.includes("aim") || fullText.includes("objective")) {
          action = {
            label: "Set goals",
            route: "/profile"
          };
          icon = <Target className={`w-5 h-5 ${getAccentColor()}`} />;
        } else if (fullText.includes("focus") || fullText.includes("session") || 
                  fullText.includes("concentrate") || fullText.includes("start now")) {
          action = {
            label: "Focus now",
            route: "/focus-session"
          };
          icon = <Clock className={`w-5 h-5 ${getAccentColor()}`} />;
        } else if (fullText.includes("community") || fullText.includes("study room") || 
                  fullText.includes("group") || fullText.includes("collaborate")) {
          action = {
            label: "Join others",
            route: "/community"
          };
          icon = <Users className={`w-5 h-5 ${getAccentColor()}`} />;
        } else if (fullText.includes("technique") || fullText.includes("method") || 
                  fullText.includes("learn") || fullText.includes("approach")) {
          action = {
            label: "Learn more",
            route: "/learning-toolkit"
          };
          icon = <Lightbulb className={`w-5 h-5 ${getAccentColor()}`} />;
        } else if (fullText.includes("analyze") || fullText.includes("report") || 
                  fullText.includes("progress") || fullText.includes("statistic")) {
          action = {
            label: "View reports",
            route: "/reports"
          };
          icon = <TrendingUp className={`w-5 h-5 ${getAccentColor()}`} />;
        }
        
        return {
          ...insight,
          icon,
          action
        };
      });
      
      setInsights(processedInsights);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setDefaultInsights();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const refreshInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        toast.info("Generating new insights...");
        await fetchInsights(user.id, hasData);
        toast.success("Insights refreshed!");
      }
    } catch (error) {
      console.error('Error refreshing insights:', error);
      toast.error("Failed to refresh insights");
    }
  };
  
  const setDefaultInsights = () => {
    if (!hasData) {
      setInsights([
        {
          title: "Start Your First Session",
          description: "Begin your first focus session to get personalized insights.",
          icon: <Lightbulb className={`w-5 h-5 ${getAccentColor()}`} />,
          action: {
            label: "Start now",
            route: "/focus-session"
          }
        },
        {
          title: "Try Different Environments",
          description: "Experiment with different study environments to find what works best for you.",
          icon: <Clock className={`w-5 h-5 ${getAccentColor()}`} />,
          action: {
            label: "Change settings",
            route: "/profile"
          }
        },
        {
          title: "Set a Weekly Goal",
          description: "Set a weekly focus goal to track your progress and improve consistently.",
          icon: <BrainCircuit className={`w-5 h-5 ${getAccentColor()}`} />,
          action: {
            label: "Set goal",
            route: "/profile"
          }
        },
      ]);
    } else {
      setInsights([
        {
          title: "Optimal Session Length",
          description: "Based on your past focus patterns, 45-minute sessions work best for you.",
          icon: <Clock className={`w-5 h-5 ${getAccentColor()}`} />,
          action: {
            label: "Try now",
            route: "/focus-session"
          }
        },
        {
          title: "Productivity Peak",
          description: `Your most productive time appears to be in the ${
            Math.random() > 0.5 ? "morning between 9-11 AM" : "afternoon between 2-4 PM"
          }.`,
          icon: <TrendingUp className={`w-5 h-5 ${getAccentColor()}`} />,
          action: {
            label: "View analytics",
            route: "/reports"
          }
        },
        {
          title: "Accountability Boost",
          description: "Schedule a daily check-in with a friend or accountability partner to report your progress. This will help you stay on track with your weekly focus goal of 20 hours and provide an added motivation to stay focused.",
          icon: <Users className={`w-5 h-5 ${getAccentColor()}`} />,
          action: {
            label: "Find partners",
            route: "/community",
            tab: "friends"
          }
        },
        {
          title: "Focus Improvement",
          description: "Try the Pomodoro technique with 25-min focus and 5-min breaks to boost your concentration.",
          icon: <BrainCircuit className={`w-5 h-5 ${getAccentColor()}`} />,
          action: {
            label: "Learn more",
            route: "/learning-toolkit"
          }
        },
      ]);
    }
  };
  
  // Get accent color based on environment
  const getAccentColor = () => {
    switch (state.environment) {
      case 'office': return "text-blue-600";
      case 'park': return "text-green-600";
      case 'home': return "text-orange-600";
      case 'coffee-shop': return "text-amber-600";
      case 'library': return "text-gray-600";
      default: return "text-triage-purple";
    }
  };
  
  // Handle navigation for insight actions
  const handleActionClick = (action: { route: string; params?: Record<string, string>; tab?: string }) => {
    // Navigate to the specified route
    navigate(action.route, { state: action.params });
    
    // If a specific tab is specified, set it in localStorage to be selected when the page loads
    if (action.tab) {
      localStorage.setItem('selectedTab', action.tab);
      
      // For Community page, directly attempt to click the tab after a short delay
      if (action.route === '/community' && action.tab) {
        setTimeout(() => {
          const tabElement = document.querySelector(`[data-walkthrough="${action.tab}"]`) as HTMLElement;
          if (tabElement) {
            tabElement.click();
          }
        }, 300);
      }
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-triage-purple" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid gap-4 md:grid-cols-3 animate-pulse">
            <div className="h-24 bg-muted rounded-md"></div>
            <div className="h-24 bg-muted rounded-md"></div>
            <div className="h-24 bg-muted rounded-md"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-triage-purple" />
            {hasData ? "AI-Powered Insights" : "Getting Started"}
          </CardTitle>
          {hasData && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={refreshInsights}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh insights</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid gap-4 md:grid-cols-3">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className="rounded-lg border p-3 shadow-sm transition-all hover:shadow-md group"
            >
              <div className="flex items-start space-x-2">
                <div className="pt-0.5">{insight.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  
                  {insight.action && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 px-2 text-xs gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleActionClick(insight.action!)}
                    >
                      {insight.action.label}
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInsights;
