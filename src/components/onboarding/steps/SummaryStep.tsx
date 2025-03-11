
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Award, Cpu, Bookmark } from "lucide-react";

export const SummaryStep = () => {
  const { state } = useOnboarding();

  // Helper function to get readable display names for values
  const getDisplayName = (type: string, value?: string) => {
    if (!value) return "Not selected";
    
    const displayNames: Record<string, Record<string, string>> = {
      goal: {
        "deep-work": "Deep Work Focus",
        "study": "Study Efficiency",
        "accountability": "Task Accountability"
      },
      workStyle: {
        "pomodoro": "Pomodoro Technique",
        "deep-work": "Deep Work Sessions",
        "balanced": "Balanced Approach"
      },
      environment: {
        "office": "Office Environment",
        "park": "Nature/Park Setting",
        "coffee-shop": "Coffee Shop Atmosphere"
      },
      sound: {
        "lo-fi": "Lo-fi Beats",
        "ambient": "Ambient Sounds",
        "classical": "Classical Music",
        "silence": "Silence"
      }
    };

    return displayNames[type][value] || value;
  };

  return (
    <div className="grid gap-6">
      <div className="text-center space-y-2">
        <div className="inline-flex justify-center mb-2">
          <Badge className="px-3 py-1 bg-triage-purple text-white">
            <Award className="w-4 h-4 mr-1" /> Onboarding Achievement
          </Badge>
        </div>
        <h3 className="text-lg font-medium">Your Personalized Productivity Profile</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Based on your selections, we've tailored your experience to match your preferences.
        </p>
      </div>

      <Card className="overflow-hidden border-triage-purple/20">
        <CardHeader className="bg-gradient-to-r from-triage-indigo/10 to-triage-purple/10 pb-2">
          <CardTitle className="text-lg flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-triage-purple" />
            Your Focus Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Focus Goal</p>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1.5 text-triage-purple" />
                  <p className="font-medium">{getDisplayName("goal", state.userGoal)}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Work Style</p>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1.5 text-triage-purple" />
                  <p className="font-medium">{getDisplayName("workStyle", state.workStyle)}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Environment</p>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1.5 text-triage-purple" />
                  <p className="font-medium">{getDisplayName("environment", state.environment)}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Sound Preference</p>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1.5 text-triage-purple" />
                  <p className="font-medium">{getDisplayName("sound", state.soundPreference)}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center text-gray-600 text-sm">
                <Bookmark className="w-4 h-4 mr-1.5 text-triage-purple" />
                <span>Settings saved to your profile</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-sm text-center text-gray-600 mt-4">
        Click 'Complete' to begin your productivity journey with these personalized settings!
      </p>
    </div>
  );
};
