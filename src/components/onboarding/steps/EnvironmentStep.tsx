
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { StudyEnvironment } from "@/types/onboarding";
import { Building, Coffee, TreeDeciduous } from "lucide-react";

const environments: Array<{ id: StudyEnvironment; title: string; description: string; icon: React.ReactNode }> = [
  {
    id: 'office',
    title: 'Office',
    description: 'Professional workspace environment',
    icon: <Building className="w-6 h-6" />,
  },
  {
    id: 'park',
    title: 'Park',
    description: 'Nature-inspired outdoor setting',
    icon: <TreeDeciduous className="w-6 h-6" />,
  },
  {
    id: 'coffee-shop',
    title: 'Coffee Shop',
    description: 'Relaxed cafe atmosphere',
    icon: <Coffee className="w-6 h-6" />,
  }
];

export const EnvironmentStep = () => {
  const { state, dispatch } = useOnboarding();

  return (
    <div className="grid gap-4">
      {environments.map((env) => (
        <Card
          key={env.id}
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            state.environment === env.id ? 'border-triage-purple shadow-md' : ''
          }`}
          onClick={() => dispatch({ type: 'SET_ENVIRONMENT', payload: env.id })}
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-purple-100 text-triage-purple">
              {env.icon}
            </div>
            <div>
              <h3 className="font-medium mb-1">{env.title}</h3>
              <p className="text-sm text-gray-600">{env.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
