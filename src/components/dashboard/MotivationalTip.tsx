
import { Card, CardContent } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { LightbulbIcon, ThumbsUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MotivationalTip = () => {
  const { state } = useOnboarding();
  
  // Get environment-specific gradient class
  const getGradientClass = () => {
    switch (state.environment) {
      case 'office': return "from-blue-50 to-indigo-100";
      case 'park': return "from-green-50 to-emerald-100";
      case 'home': return "from-amber-50 to-orange-100";
      case 'coffee-shop': return "from-amber-100 to-yellow-100";
      case 'library': return "from-slate-100 to-gray-100";
      default: return "from-purple-50 to-indigo-100";
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
  
  // Get a random motivational tip
  const getRandomTip = () => {
    const tips = [
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
    
    return tips[Math.floor(Math.random() * tips.length)];
  };
  
  return (
    <Card className="overflow-hidden mt-4">
      <div className={cn("bg-gradient-to-r p-5", getGradientClass())}>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-white/40 mr-3">
              <LightbulbIcon className={cn("w-5 h-5", getAccentColor())} />
            </div>
            <h3 className="font-medium">Daily Inspiration</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-70 hover:opacity-100">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <blockquote className="mt-3 italic text-gray-700">
          "{getRandomTip()}"
        </blockquote>
        
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 opacity-70 hover:opacity-100">
            <ThumbsUp className="h-3.5 w-3.5" />
            Helpful
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MotivationalTip;
