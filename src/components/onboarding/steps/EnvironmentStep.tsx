
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { StudyEnvironment } from "@/types/onboarding";
import { Building, Coffee, TreeDeciduous, BookOpen, Home } from "lucide-react";

const environments: Array<{ id: StudyEnvironment; title: string; description: string; icon: React.ReactNode; color: string }> = [
  {
    id: 'office',
    title: 'Office',
    description: 'Professional workspace environment',
    icon: <Building className="w-6 h-6" />,
    color: '#4F46E5', // Indigo
  },
  {
    id: 'park',
    title: 'Park',
    description: 'Nature-inspired outdoor setting',
    icon: <TreeDeciduous className="w-6 h-6" />,
    color: '#10B981', // Green
  },
  {
    id: 'home',
    title: 'Home',
    description: 'Comfortable home atmosphere',
    icon: <Home className="w-6 h-6" />,
    color: '#F59E0B', // Amber
  },
  {
    id: 'coffee-shop',
    title: 'Coffee Shop',
    description: 'Relaxed cafe atmosphere',
    icon: <Coffee className="w-6 h-6" />,
    color: '#B45309', // Brown
  },
  {
    id: 'library',
    title: 'Library',
    description: 'Quiet and focused study space',
    icon: <BookOpen className="w-6 h-6" />,
    color: '#7C3AED', // Purple
  }
];

export const EnvironmentStep = () => {
  const { state, dispatch } = useOnboarding();

  const handleSelect = (envId: StudyEnvironment, color: string) => {
    dispatch({ 
      type: 'SET_ENVIRONMENT', 
      payload: envId,
      meta: { color }
    });
  };

  return (
    <div className="w-full grid gap-3">
      {environments.map((env) => (
        <Card
          key={env.id}
          className={`p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md ${
            state.environment === env.id ? 'border-2 shadow-md' : 'border'
          }`}
          style={{
            borderColor: state.environment === env.id ? env.color : '',
          }}
          onClick={() => handleSelect(env.id, env.color)}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div 
              className="p-2 rounded-full"
              style={{ 
                backgroundColor: `${env.color}20`, // 20% opacity
                color: env.color
              }}
            >
              {env.icon}
            </div>
            <div>
              <h3 className="font-medium mb-0.5 sm:mb-1">{env.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{env.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
