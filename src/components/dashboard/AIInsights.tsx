
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { BrainCircuit, Clock, Sparkles, TrendingUp } from "lucide-react";

const AIInsights = () => {
  const { state } = useOnboarding();
  
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
  
  const getInsightData = () => {
    // In a real app, these would be generated from actual user data
    return [
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
    ];
  };
  
  const insights = getInsightData();
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-triage-purple" />
          AI-Powered Insights
        </CardTitle>
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
