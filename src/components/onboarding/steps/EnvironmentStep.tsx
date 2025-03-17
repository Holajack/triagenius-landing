
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { StudyEnvironment } from "@/types/onboarding";
import { Building, Coffee, TreeDeciduous, BookOpen, Home } from "lucide-react";

// Define environment themes with their respective colors
const environments: Array<{
  id: StudyEnvironment;
  title: string;
  description: string;
  icon: React.ReactNode;
  colors: {
    primary: string;
    bg: string;
    accent: string;
    border: string;
  };
}> = [
  {
    id: 'office',
    title: 'Office',
    description: 'Professional workspace environment',
    icon: <Building className="w-6 h-6" />,
    colors: {
      primary: 'bg-blue-600',
      bg: 'from-blue-50 to-slate-100',
      accent: 'text-blue-700',
      border: 'border-blue-200',
    }
  },
  {
    id: 'park',
    title: 'Nature',
    description: 'Nature-inspired outdoor setting',
    icon: <TreeDeciduous className="w-6 h-6" />,
    colors: {
      primary: 'bg-green-600',
      bg: 'from-green-50 to-emerald-100',
      accent: 'text-emerald-700',
      border: 'border-green-200',
    }
  },
  {
    id: 'home',
    title: 'Home',
    description: 'Comfortable home atmosphere',
    icon: <Home className="w-6 h-6" />,
    colors: {
      primary: 'bg-amber-600',
      bg: 'from-amber-50 to-orange-100',
      accent: 'text-amber-700',
      border: 'border-amber-200',
    }
  },
  {
    id: 'coffee-shop',
    title: 'Coffee Shop',
    description: 'Relaxed cafe atmosphere',
    icon: <Coffee className="w-6 h-6" />,
    colors: {
      primary: 'bg-amber-500',
      bg: 'from-amber-100 to-stone-100',
      accent: 'text-amber-800',
      border: 'border-amber-300',
    }
  },
  {
    id: 'library',
    title: 'Library',
    description: 'Quiet and focused study space',
    icon: <BookOpen className="w-6 h-6" />,
    colors: {
      primary: 'bg-gray-600',
      bg: 'from-slate-100 to-gray-100',
      accent: 'text-gray-700',
      border: 'border-gray-200',
    }
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
            state.environment === env.id ? 'shadow-md' : ''
          }`}
          onClick={() => dispatch({ type: 'SET_ENVIRONMENT', payload: env.id })}
          style={{
            borderColor: state.environment === env.id ? 'var(--env-primary)' : undefined,
            borderWidth: state.environment === env.id ? '2px' : '1px',
          }}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full ${env.colors.primary} text-white`}>
              {env.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-1">{env.title}</h3>
              <p className="text-sm text-gray-600">{env.description}</p>
            </div>
            
            {/* Color preview */}
            <div className="flex items-center space-x-2">
              <div className={`h-4 w-4 rounded-full ${env.colors.primary}`} title="Primary color"></div>
              <div className={`h-4 w-4 rounded-full bg-gradient-to-r ${env.colors.bg}`} title="Background gradient"></div>
              <div className={`h-4 w-4 rounded-full ${env.colors.border}`} title="Border color"></div>
            </div>
          </div>
          
          {/* Theme preview */}
          {state.environment === env.id && (
            <div className="mt-3 p-3 rounded-md bg-gradient-to-r ${env.colors.bg} ${env.colors.border} text-sm">
              <p className={env.colors.accent}>This is how your dashboard colors will look</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
