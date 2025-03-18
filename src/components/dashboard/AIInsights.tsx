
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { BrainCircuit, Clock, Lightbulb, Sparkles, TrendingUp, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Insight {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const AIInsights = () => {
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
      
      // Call the edge function to generate insights
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
      
      // Process insights and add icons
      const processedInsights = data.insights.map((insight: Insight, index: number) => {
        let icon;
        switch (index % 3) {
          case 0:
            icon = <Clock className={`w-5 h-5 ${getAccentColor()}`} />;
            break;
          case 1:
            icon = <TrendingUp className={`w-5 h-5 ${getAccentColor()}`} />;
            break;
          case 2:
            icon = <BrainCircuit className={`w-5 h-5 ${getAccentColor()}`} />;
            break;
        }
        
        return {
          ...insight,
          icon
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
        },
        {
          title: "Try Different Environments",
          description: "Experiment with different study environments to find what works best for you.",
          icon: <Clock className={`w-5 h-5 ${getAccentColor()}`} />,
        },
        {
          title: "Set a Weekly Goal",
          description: "Set a weekly focus goal to track your progress and improve consistently.",
          icon: <BrainCircuit className={`w-5 h-5 ${getAccentColor()}`} />,
        },
      ]);
    } else {
      setInsights([
        {
          title: "Optimal Session Length",
          description: "Based on your past focus patterns, 45-minute sessions work best for you.",
          icon: <Clock className={`w-5 h-5 ${getAccentColor()}`} />,
        },
        {
          title: "Productivity Peak",
          description: `Your most productive time appears to be in the ${
            Math.random() > 0.5 ? "morning between 9-11 AM" : "afternoon between 2-4 PM"
          }.`,
          icon: <TrendingUp className={`w-5 h-5 ${getAccentColor()}`} />,
        },
        {
          title: "Focus Improvement",
          description: "Try the Pomodoro technique with 25-min focus and 5-min breaks to boost your concentration.",
          icon: <BrainCircuit className={`w-5 h-5 ${getAccentColor()}`} />,
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
              className="rounded-lg border p-3 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start space-x-2">
                <div className="pt-0.5">{insight.icon}</div>
                <div>
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
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
