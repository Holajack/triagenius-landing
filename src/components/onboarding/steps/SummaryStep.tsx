
import { useOnboarding } from "@/contexts/OnboardingContext";
import { CheckCircle } from "lucide-react";

export const SummaryStep = () => {
  const { state } = useOnboarding();
  
  const getGoalText = () => {
    switch(state.userGoal) {
      case 'deep-work': return 'Deep Work Focus';
      case 'study': return 'Study Efficiency';
      case 'accountability': return 'Task Accountability';
      default: return 'Not selected';
    }
  };
  
  const getWorkStyleText = () => {
    switch(state.workStyle) {
      case 'pomodoro': return 'Pomodoro Technique';
      case 'deep-work': return 'Deep Work Sessions';
      case 'balanced': return 'Balanced Approach';
      default: return 'Not selected';
    }
  };
  
  const getEnvironmentText = () => {
    switch(state.environment) {
      case 'office': return 'Office';
      case 'park': return 'Park';
      case 'home': return 'Home';
      case 'coffee-shop': return 'Coffee Shop';
      case 'library': return 'Library';
      default: return 'Not selected';
    }
  };
  
  const getSoundText = () => {
    switch(state.soundPreference) {
      case 'lo-fi': return 'Lo-fi Music';
      case 'ambient': return 'Ambient Sounds';
      case 'classical': return 'Classical Music';
      case 'silence': return 'Silence';
      default: return 'Not selected';
    }
  };

  return (
    <div className="w-full flex flex-col items-start space-y-4 py-2">
      <div 
        className="w-full rounded-xl p-5 text-center mb-2"
        style={{ 
          backgroundColor: `${state.environmentColor}10`, // 10% opacity
          color: state.environmentColor 
        }}
      >
        <h3 className="font-medium text-lg mb-1">Your Focus Experience</h3>
        <p className="text-sm opacity-90">Personalized to match your preferences</p>
      </div>
      
      <div className="space-y-3 w-full">
        <SummaryItem 
          label="Goal" 
          value={getGoalText()} 
          color={state.environmentColor || '#7C3AED'} 
        />
        <SummaryItem 
          label="Work Style" 
          value={getWorkStyleText()} 
          color={state.environmentColor || '#7C3AED'} 
        />
        <SummaryItem 
          label="Environment" 
          value={getEnvironmentText()} 
          color={state.environmentColor || '#7C3AED'} 
        />
        <SummaryItem 
          label="Sound" 
          value={getSoundText()} 
          color={state.environmentColor || '#7C3AED'}
        />
      </div>
      
      <div 
        className="text-center w-full mt-4 pt-4 border-t text-sm"
        style={{ color: state.environmentColor }}
      >
        Ready to start your focused work session!
      </div>
    </div>
  );
};

interface SummaryItemProps {
  label: string;
  value: string;
  color: string;
}

const SummaryItem = ({ label, value, color }: SummaryItemProps) => (
  <div className="flex items-center gap-2 py-2 px-3 rounded-lg border">
    <CheckCircle className="w-4 h-4 shrink-0" style={{ color }} />
    <div className="flex justify-between w-full">
      <span className="font-medium text-sm">{label}:</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  </div>
);
