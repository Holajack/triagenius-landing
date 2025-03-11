
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Award, Cpu, Bookmark } from "lucide-react";

export const SummaryStep = () => {
  const { state } = useOnboarding();

  // Environment color themes
  const environmentThemes: Record<string, { bg: string; text: string; cardBg: string; accent: string }> = {
    'office': {
      bg: 'from-blue-50 to-slate-100',
      text: 'text-slate-800',
      cardBg: 'from-blue-100/30 to-slate-100/30',
      accent: 'text-blue-700'
    },
    'park': {
      bg: 'from-green-50 to-emerald-100/50',
      text: 'text-emerald-900',
      cardBg: 'from-green-100/30 to-emerald-50/30',
      accent: 'text-emerald-700'
    },
    'home': {
      bg: 'from-amber-50 to-orange-100/40',
      text: 'text-amber-900',
      cardBg: 'from-amber-100/30 to-orange-50/30',
      accent: 'text-amber-700'
    },
    'coffee-shop': {
      bg: 'from-amber-100/50 to-stone-100',
      text: 'text-stone-800',
      cardBg: 'from-amber-100/30 to-stone-100/30',
      accent: 'text-amber-800'
    },
    'library': {
      bg: 'from-slate-100 to-gray-100',
      text: 'text-gray-800',
      cardBg: 'from-slate-100/30 to-gray-100/30',
      accent: 'text-gray-700'
    }
  };

  // Get current theme or default to office
  const currentTheme = state.environment ? environmentThemes[state.environment] : environmentThemes['office'];

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
        "home": "Home Environment",
        "coffee-shop": "Coffee Shop Atmosphere",
        "library": "Library Setting"
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
        <h3 className={`text-lg font-medium ${currentTheme.text}`}>Your Personalized Productivity Profile</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Based on your selections, we've tailored your experience to match your preferences.
        </p>
      </div>

      <Card className={`overflow-hidden border-${state.environment ? state.environment : 'triage-purple'}/20`}>
        <CardHeader className={`bg-gradient-to-r ${currentTheme.cardBg} pb-2`}>
          <CardTitle className={`text-lg flex items-center ${currentTheme.text}`}>
            <Cpu className={`w-5 h-5 mr-2 ${currentTheme.accent}`} />
            Your Focus Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Focus Goal</p>
                <div className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-1.5 ${currentTheme.accent}`} />
                  <p className="font-medium">{getDisplayName("goal", state.userGoal)}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Work Style</p>
                <div className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-1.5 ${currentTheme.accent}`} />
                  <p className="font-medium">{getDisplayName("workStyle", state.workStyle)}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Environment</p>
                <div className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-1.5 ${currentTheme.accent}`} />
                  <p className="font-medium">{getDisplayName("environment", state.environment)}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Sound Preference</p>
                <div className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-1.5 ${currentTheme.accent}`} />
                  <p className="font-medium">{getDisplayName("sound", state.soundPreference)}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-2 flex items-center justify-between">
              <div className={`flex items-center text-sm ${currentTheme.text}`}>
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
