
import React from "react";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ 
  currentStep, 
  totalSteps 
}) => {
  return (
    <div className="flex gap-1 justify-center">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-1.5 w-16 rounded-full transition-colors ${
            index < currentStep ? 'bg-triage-purple' : 
            index === currentStep ? 'bg-triage-purple shadow-sm' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
};

export default OnboardingProgress;
