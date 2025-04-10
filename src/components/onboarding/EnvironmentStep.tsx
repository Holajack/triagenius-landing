import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { StudyEnvironment } from '@/types/onboarding';
import { Coffee, Building2, Trees, Home, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export const EnvironmentStep = () => {
  const { state, dispatch } = useOnboarding();

  const environments = [
    {
      id: 'office',
      title: 'Office',
      description: 'Professional work environment',
      icon: <Building2 className="w-6 h-6" />,
      colors: {
        primary: 'bg-blue-700',
        bg: 'from-blue-700/10 to-blue-700/5',
        accent: 'text-blue-700',
        border: 'border-blue-700',
        card: 'shadow-blue-700/60',
      }
    },
    {
      id: 'park',
      title: 'Park',
      description: 'Outdoor nature environment',
      icon: <Trees className="w-6 h-6" />,
      colors: {
        primary: 'bg-[#2E6F40]',
        bg: 'from-[#2E6F40]/10 to-[#2E6F40]/5',
        accent: 'text-[#2E6F40]',
        border: 'border-[#2E6F40]',
        card: 'shadow-[#2E6F40]/60',
      }
    },
    {
      id: 'home',
      title: 'Home',
      description: 'Comfortable home setting',
      icon: <Home className="w-6 h-6" />,
      colors: {
        primary: 'bg-[#FFA263]',
        bg: 'from-[#FFA263]/10 to-[#FFA263]/5',
        accent: 'text-[#FFA263]',
        border: 'border-[#FFA263]',
        card: 'shadow-[#FFA263]/60',
      }
    },
    {
      id: 'coffee-shop',
      title: 'Coffee Shop',
      description: 'Relaxed cafe atmosphere',
      icon: <Coffee className="w-6 h-6" />,
      colors: {
        primary: 'bg-[#6E4E3A]',
        bg: 'from-[#6E4E3A]/10 to-[#6E4E3A]/5',
        accent: 'text-[#6E4E3A]',
        border: 'border-[#6E4E3A]',
        card: 'shadow-[#6E4E3A]/60',
      }
    },
    {
      id: 'library',
      title: 'Library',
      description: 'Quiet study environment',
      icon: <BookOpen className="w-6 h-6" />,
      colors: {
        primary: 'bg-gray-700',
        bg: 'from-gray-700/10 to-gray-700/5',
        accent: 'text-gray-700',
        border: 'border-gray-700',
        card: 'shadow-gray-700/60',
      }
    }
  ];

  const selectEnvironment = (environment: StudyEnvironment) => {
    dispatch({ type: 'SET_ENVIRONMENT', payload: environment });
  };

  return (
    <div className="w-full">
      <p className="text-gray-600 text-center mb-6">
        Choose the environment that helps you stay focused and productive.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {environments.map((env) => (
          <motion.div
            key={env.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex items-center p-4 rounded-lg cursor-pointer border transition-all
              ${state.environment === env.id ? `${env.colors.border} bg-gradient-to-br ${env.colors.bg}` : 'border-gray-200 hover:bg-gray-50'}
            `}
            onClick={() => selectEnvironment(env.id as StudyEnvironment)}
          >
            <div className={`
              rounded-full p-2 mr-3 
              ${state.environment === env.id ? env.colors.primary : 'bg-gray-100'}
            `}>
              <div className={state.environment === env.id ? 'text-white' : 'text-gray-500'}>
                {env.icon}
              </div>
            </div>
            <div>
              <h3 className={`font-medium ${state.environment === env.id ? env.colors.accent : 'text-gray-900'}`}>
                {env.title}
              </h3>
              <p className="text-sm text-gray-500">{env.description}</p>
            </div>
            {state.environment === env.id && (
              <div className="ml-auto w-2 h-2 rounded-full bg-green-500"></div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EnvironmentStep;
