
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { UserGoal } from "@/types/onboarding";
import { LightbulbIcon, ListIcon, Timer } from "lucide-react";

const goals: Array<{ id: UserGoal; title: string; description: string; icon: React.ReactNode }> = [
  {
    id: 'deep-work',
    title: 'Deep Work',
    description: 'Achieve maximum focus on a single, complex task without interruptions',
    icon: <Timer className="w-6 h-6" />,
  },
  {
    id: 'study',
    title: 'Study Efficiency',
    description: 'Optimize learning and retention through structured sessions',
    icon: <LightbulbIcon className="w-6 h-6" />,
  },
  {
    id: 'accountability',
    title: 'Task Accountability',
    description: 'Stay on track with tasks and meet deadlines effectively',
    icon: <ListIcon className="w-6 h-6" />,
  },
];

export const UserGoalStep = () => {
  const { state, dispatch } = useOnboarding();

  return (
    <div className="grid gap-4">
      {goals.map((goal) => (
        <Card
          key={goal.id}
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            state.userGoal === goal.id ? 'border-triage-purple shadow-md' : ''
          }`}
          onClick={() => dispatch({ type: 'SET_USER_GOAL', payload: goal.id })}
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-purple-100 text-triage-purple">
              {goal.icon}
            </div>
            <div>
              <h3 className="font-medium mb-1">{goal.title}</h3>
              <p className="text-sm text-gray-600">{goal.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
