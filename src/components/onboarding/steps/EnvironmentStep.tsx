import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { StudyEnvironment } from "@/types/onboarding";
import { Building, Coffee, TreeDeciduous, BookOpen, Home } from "lucide-react";

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
    card: string;
  };
}> = [
  {
    id: 'office',
    title: 'Office',
    description: 'Professional workspace environment',
    icon: <Building className="w-6 h-6" />,
    colors: {
      primary: 'bg-blue-600',
      bg: 'from-blue-100 to-blue-50',
      accent: 'text-blue-700',
      border: 'border-blue-300',
      card: 'shadow-blue-100/50',
    }
  },
  {
    id: 'park',
    title: 'Nature',
    description: 'Nature-inspired outdoor setting',
    icon: <TreeDeciduous className="w-6 h-6" />,
    colors: {
      primary: 'bg-green-600',
      bg: 'from-green-100 to-emerald-50',
      accent: 'text-emerald-700',
      border: 'border-green-300',
      card: 'shadow-green-100/50',
    }
  },
  {
    id: 'home',
    title: 'Home',
    description: 'Comfortable home atmosphere',
    icon: <Home className="w-6 h-6" />,
    colors: {
      primary: 'bg-orange-500',
      bg: 'from-orange-100 to-amber-50',
      accent: 'text-amber-700',
      border: 'border-orange-300',
      card: 'shadow-orange-100/50',
    }
  },
  {
    id: 'coffee-shop',
    title: 'Coffee Shop',
    description: 'Relaxed cafe atmosphere',
    icon: <Coffee className="w-6 h-6" />,
    colors: {
      primary: 'bg-amber-500',
      bg: 'from-amber-100 to-yellow-50',
      accent: 'text-amber-800',
      border: 'border-amber-300',
      card: 'shadow-amber-100/50',
    }
  },
  {
    id: 'library',
    title: 'Library',
    description: 'Quiet and focused study space',
    icon: <BookOpen className="w-6 h-6" />,
    colors: {
      primary: 'bg-gray-600',
      bg: 'from-gray-100 to-slate-50',
      accent: 'text-gray-700',
      border: 'border-gray-300',
      card: 'shadow-gray-100/50',
    }
  }
];

export const EnvironmentStep = () => {
  const { state, dispatch } = useOnboarding();
  const [theme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (state.environment) {
      localStorage.setItem('environment', state.environment);
      
      if (state.environment) {
        document.documentElement.classList.remove(
          'theme-office', 
          'theme-park', 
          'theme-home', 
          'theme-coffee-shop', 
          'theme-library'
        );
        
        document.documentElement.classList.add(`theme-${state.environment}`);
        
        document.documentElement.setAttribute('data-environment', state.environment);
      }
    }
  }, [state.environment]);

  const handleEnvironmentSelection = (envId: StudyEnvironment) => {
    dispatch({ type: 'SET_ENVIRONMENT', payload: envId });
    localStorage.setItem('environment', envId);
    
    document.documentElement.classList.remove(
      'theme-office', 
      'theme-park', 
      'theme-home', 
      'theme-coffee-shop', 
      'theme-library'
    );
    document.documentElement.classList.add(`theme-${envId}`);
    document.documentElement.setAttribute('data-environment', envId);
  };

  return (
    <div className="grid gap-4">
      {environments.map((env) => (
        <Card
          key={env.id}
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            state.environment === env.id ? `shadow-md ${env.colors.card}` : ''
          }`}
          onClick={() => handleEnvironmentSelection(env.id)}
          style={{
            borderColor: state.environment === env.id ? `var(--env-primary)` : undefined,
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
            
            <div className="flex items-center space-x-2">
              <div className={`h-5 w-5 rounded-full ${env.colors.primary}`} title="Primary color"></div>
              <div className={`h-5 w-5 rounded-full bg-gradient-to-r ${env.colors.bg}`} title="Background gradient"></div>
              <div className={`h-5 w-5 rounded-full ${env.colors.border}`} title="Border color"></div>
            </div>
          </div>
          
          {state.environment === env.id && (
            <div className={`mt-3 p-4 rounded-md bg-gradient-to-r ${env.colors.bg} border ${env.colors.border} text-sm`}>
              <p className={`${env.colors.accent} font-medium`}>This is how your dashboard colors will look</p>
              <div className="flex mt-2 gap-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${env.colors.primary} text-white`}>Button</span>
                <span className={`inline-block px-2 py-1 rounded-full text-xs border ${env.colors.border} ${env.colors.accent}`}>Tag</span>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
