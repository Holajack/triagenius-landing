
import { Card, CardContent } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { LightbulbIcon, ThumbsUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Define the motivational tips outside the component
const motivationalTips = [
  "The secret of getting ahead is getting started.",
  "Small progress is still progress.",
  "Your focus determines your reality.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Don't watch the clock; do what it does. Keep going.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "It always seems impossible until it's done.",
  "The future depends on what you do today.",
  "You don't have to be great to start, but you have to start to be great."
];

// Function to get a random tip - defined before it's used
const getRandomTip = () => {
  return motivationalTips[Math.floor(Math.random() * motivationalTips.length)];
};

const MotivationalTip = () => {
  const { state } = useOnboarding();
  const [tip, setTip] = useState(() => getRandomTip());
  
  // Get environment-specific gradient class with more vibrant colors
  const getGradientClass = () => {
    switch (state.environment) {
      case 'office': return "from-blue-200 to-blue-50";
      case 'park': return "from-green-200 to-green-50"; // More vibrant green
      case 'home': return "from-orange-200 to-orange-50"; // More vibrant orange
      case 'coffee-shop': return "from-amber-200 to-amber-50"; // More vibrant amber
      case 'library': return "from-slate-200 to-gray-50";
      default: return "from-purple-200 to-indigo-50";
    }
  };
  
  // Get accent color based on environment with more vibrant colors
  const getAccentColor = () => {
    switch (state.environment) {
      case 'office': return "text-blue-600";
      case 'park': return "text-green-600"; // More vibrant green
      case 'home': return "text-orange-500"; // More vibrant orange
      case 'coffee-shop': return "text-amber-600"; // More vibrant amber
      case 'library': return "text-gray-600";
      default: return "text-triage-purple";
    }
  };
  
  // Get button style based on environment with more vibrant colors
  const getButtonStyle = () => {
    switch (state.environment) {
      case 'office': return "hover:bg-blue-100 active:bg-blue-200";
      case 'park': return "hover:bg-green-100 active:bg-green-200"; // More vibrant green
      case 'home': return "hover:bg-orange-100 active:bg-orange-200"; // More vibrant orange
      case 'coffee-shop': return "hover:bg-amber-100 active:bg-amber-200"; // More vibrant amber
      case 'library': return "hover:bg-gray-100 active:bg-gray-200";
      default: return "hover:bg-purple-100 active:bg-purple-200";
    }
  };

  const handleRefresh = () => {
    setTip(getRandomTip());
  };
  
  return (
    <Card className="overflow-hidden mt-4 env-card shadow-sm">
      <div className={cn(
        "bg-gradient-to-r p-5", 
        getGradientClass(),
        state.environment === 'office' ? "border-l-4 border-l-blue-500" :
        state.environment === 'park' ? "border-l-4 border-l-green-600" : // More vibrant green
        state.environment === 'home' ? "border-l-4 border-l-orange-500" : // More vibrant orange
        state.environment === 'coffee-shop' ? "border-l-4 border-l-amber-600" : // More vibrant amber
        state.environment === 'library' ? "border-l-4 border-l-gray-500" :
        "border-l-4 border-l-purple-500"
      )}>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className={`p-2 rounded-full bg-white/90 mr-3 shadow-sm`}>
              <LightbulbIcon className={cn("w-5 h-5", getAccentColor())} />
            </div>
            <h3 className="font-medium">Daily Inspiration</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 rounded-full opacity-70 hover:opacity-100 ${getButtonStyle()}`}
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <blockquote className="mt-3 italic text-gray-700 font-serif">
          "{tip}"
        </blockquote>
        
        <div className="mt-3 flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 text-xs gap-1 opacity-70 hover:opacity-100 ${getButtonStyle()}`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            Helpful
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MotivationalTip;
