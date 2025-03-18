
import React from "react";

interface OnboardingHeaderProps {
  title: string;
  currentStep: number;
  totalSteps: number;
  userData?: { email: string; username: string } | null;
}

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ 
  title, 
  currentStep, 
  totalSteps,
  userData 
}) => {
  return (
    <>
      {userData && (
        <div className="mb-4 text-center">
          <p className="text-sm text-muted-foreground">Customizing experience for {userData.username}</p>
        </div>
      )}
      
      <div className="pt-6 pb-4 border-b">
        <h2 className="text-2xl font-semibold text-center mb-4">{title}</h2>
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
      </div>
    </>
  );
};

export default OnboardingHeader;
