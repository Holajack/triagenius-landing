
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Award, Cpu, Bookmark } from "lucide-react";

export const SummaryStep = () => {
  const { state } = useOnboarding();

  // Environment color themes - enhanced for better visibility
  const environmentThemes: Record<string, { bg: string; text: string; cardBg: string; accent: string; border: string }> = {
    'office': {
      bg: 'from-blue-100 to-blue-50',
      text: 'text-blue-800',
      cardBg: 'from-blue-100/40 to-blue-50/40',
      accent: 'text-blue-600',
      border: 'border-blue-200'
    },
    'park': {
      bg: 'from-green-100 to-green-50',
      text: 'text-green-800',
      cardBg: 'from-green-100/40 to-green-50/40',
      accent: 'text-green-700',
      border: 'border-green-200'
    },
    'home': {
      bg: 'from-orange-100 to-orange-50',
      text: 'text-orange-600',
      cardBg: 'from-orange-100/40 to-orange-50/40',
      accent: 'text-orange-500',
      border: 'border-orange-200'
    },
    'coffee-shop': {
      bg: 'from-amber-100 to-amber-50',
      text: 'text-amber-800',
      cardBg: 'from-amber-100/40 to-amber-50/40',
      accent: 'text-amber-700',
      border: 'border-amber-200'
    },
    'library': {
      bg: 'from-gray-100 to-slate-50',
      text: 'text-gray-800',
      cardBg: 'from-gray-100/40 to-slate-50/40',
      accent: 'text-gray-600',
      border: 'border-gray-200'
    }
  };

  // Get environment badge color
  const getEnvironmentBadgeClass = () => {
    switch (state.environment) {
      case 'office': return "bg-blue-600 hover:bg-blue-700";
      case 'park': return "bg-green-800 hover:bg-green-900";
      case 'home': return "bg-orange-500 hover:bg-orange-600";
      case 'coffee-shop': return "bg-amber-800 hover:bg-amber-900";
      case 'library': return "bg-gray-600 hover:bg-gray-700";
      default: return "bg-triage-purple";
    }
  };

  // Get the current theme based on the selected environment
  const getCurrentTheme = () => {
    if (!state.environment || !environmentThemes[state.environment]) {
      return environmentThemes['office']; // Default to office if no environment is selected
    }
    return environmentThemes[state.environment];
  };

  const currentTheme = getCurrentTheme();

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
        "park": "Nature Environment",
        "home": "Home Environment",
        "coffee-shop": "Coffee Shop Atmosphere",
        "library": "Library Setting"
      },
      sound: {
        "lo-fi": "Lo-fi Beats",
        "ambient": "Ambient Sounds",
        "classical": "Classical Music",
        "nature": "Nature Sounds",
        "silence": "Silence"
      }
    };

    return displayNames[type][value] || value;
  };
  
  return (
    <div className="grid gap-6">
      <div className="text-center space-y-2">
        <div className="inline-flex justify-center mb-2">
          <Badge className={`px-3 py-1 ${getEnvironmentBadgeClass()} text-white`}>
            <Award className="w-4 h-4 mr-1" /> Onboarding Achievement
          </Badge>
        </div>
        <h3 className={`text-lg font-medium ${currentTheme.text}`}>Your Personalized Productivity Profile</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Based on your selections, we've tailored your experience to match your preferences.
        </p>
      </div>

      <Card className={`overflow-hidden ${currentTheme.border}`}>
        <CardHeader className={`bg-gradient-to-r ${currentTheme.bg} pb-2`}>
          <CardTitle className={`text-lg flex items-center ${currentTheme.text}`}>
            <Cpu className={`w-5 h-5 mr-2 ${currentTheme.accent}`} />
            Your Focus Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className={`pt-4 bg-gradient-to-br ${currentTheme.cardBg}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-2 rounded-md bg-white/70">
                <p className="text-xs text-gray-500">Focus Goal</p>
                <div className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-1.5 ${currentTheme.accent}`} />
                  <p className="font-medium">{getDisplayName("goal", state.userGoal)}</p>
                </div>
              </div>
              
              <div className="space-y-1 p-2 rounded-md bg-white/70">
                <p className="text-xs text-gray-500">Work Style</p>
                <div className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-1.5 ${currentTheme.accent}`} />
                  <p className="font-medium">{getDisplayName("workStyle", state.workStyle)}</p>
                </div>
              </div>
              
              <div className="space-y-1 p-2 rounded-md bg-white/70">
                <p className="text-xs text-gray-500">Environment</p>
                <div className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-1.5 ${currentTheme.accent}`} />
                  <p className="font-medium">{getDisplayName("environment", state.environment)}</p>
                </div>
              </div>
              
              <div className="space-y-1 p-2 rounded-md bg-white/70">
                <p className="text-xs text-gray-500">Sound Preference</p>
                <div className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-1.5 ${currentTheme.accent}`} />
                  <p className="font-medium">{getDisplayName("sound", state.soundPreference)}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-2 flex items-center justify-between">
              <div className={`flex items-center text-sm ${currentTheme.text} bg-white/70 px-3 py-1.5 rounded-full`}>
                <Bookmark className={`w-4 h-4 mr-1.5 ${currentTheme.accent}`} />
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
