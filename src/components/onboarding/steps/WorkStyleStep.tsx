
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { WorkStyle } from "@/types/onboarding";
import { Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const workStyles: Array<{ id: WorkStyle; title: string; description: string; icon: React.ReactNode }> = [
  {
    id: 'pomodoro',
    title: 'Sprints',
    description: 'Short focused bursts with regular breaks',
    icon: <Timer className="w-6 h-6" />,
  },
  {
    id: 'balanced',
    title: 'Balanced',
    description: 'Flexible sessions with AI-suggested breaks',
    icon: <Timer className="w-6 h-6 rotate-90" />,
  },
  {
    id: 'deep-work',
    title: 'Deep Work',
    description: 'Extended periods of focused concentration',
    icon: <Timer className="w-6 h-6 rotate-180" />,
  },
];

export const WorkStyleStep = () => {
  const { state, dispatch } = useOnboarding();

  return (
    <div className="grid gap-4">
      {workStyles.map((style) => (
        <Card
          key={style.id}
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            state.workStyle === style.id ? 'border-triage-purple shadow-md' : ''
          }`}
          onClick={() => dispatch({ type: 'SET_WORK_STYLE', payload: style.id })}
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-purple-100 text-triage-purple">
              {style.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium mb-1">{style.title}</h3>
                {style.id === 'balanced' && (
                  <Badge className="bg-green-500 text-white text-xs font-medium">Recommended</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{style.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
