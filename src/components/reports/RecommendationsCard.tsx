
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Brain, Book, AlertCircle } from "lucide-react";

const RecommendationsCard = () => {
  // Mock recommendation data
  const recommendations = [
    {
      type: "balance",
      message: "Consider adding more creative activities to balance your cognitive workload.",
      icon: <Brain className="h-5 w-5 text-primary" />,
    },
    {
      type: "optimization",
      message: "Your peak productivity is between 9-11 AM. Schedule complex tasks during this window.",
      icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
    },
    {
      type: "learning",
      message: "Try spaced repetition techniques to improve your memory retention scores.",
      icon: <Book className="h-5 w-5 text-green-500" />,
    },
    {
      type: "warning",
      message: "You've had 5 extended study sessions this week. Consider more breaks to prevent burnout.",
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    },
  ];

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
              <div className="text-xs p-2 bg-yellow-100 text-yellow-800 rounded flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                Creativity
              </div>
              <div className="text-xs p-2 bg-blue-100 text-blue-800 rounded flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Analytical
              </div>
              <div className="text-xs p-2 bg-purple-100 text-purple-800 rounded flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                Memory
              </div>
              <div className="text-xs p-2 bg-green-100 text-green-800 rounded flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Critical Thinking
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationsCard;
