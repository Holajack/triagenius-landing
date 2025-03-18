
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onNext: () => void;
  onBack: () => void;
}

const OnboardingNavigation: React.FC<OnboardingNavigationProps> = ({ 
  currentStep, 
  totalSteps,
  canProceed,
  onNext,
  onBack 
}) => {
  return (
    <div className="flex justify-between mt-8">
      <Button
        variant="outline"
        onClick={onBack}
        className="border-gray-200"
        size="sm"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <Button 
        onClick={onNext}
        className="bg-triage-purple hover:bg-triage-purple/90 text-white"
        disabled={!canProceed}
        size="sm"
      >
        {currentStep === totalSteps - 1 ? (
          'Complete'
        ) : (
          <>
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </>
        )}
      </Button>
    </div>
  );
};

export default OnboardingNavigation;
