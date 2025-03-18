
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onNext: () => void;
  onBack: () => void;
  isPwa?: boolean;
}

const OnboardingNavigation: React.FC<OnboardingNavigationProps> = ({ 
  currentStep, 
  totalSteps,
  canProceed,
  onNext,
  onBack,
  isPwa = false
}) => {
  const handleNext = () => {
    // Check if we're on a mobile device in PWA mode
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    const isMobilePwa = isStandalone && isMobile;
    
    if ((isPwa || isMobilePwa) && currentStep === totalSteps - 1) {
      // For mobile PWA, provide direct feedback
      const btn = document.activeElement as HTMLElement;
      if (btn) btn.blur();
      
      // Call the handler directly without delay for mobile PWA
      if (isMobilePwa) {
        console.log('Mobile PWA: Completing onboarding directly');
        onNext();
      } else {
        // For desktop PWA, use a small delay
        setTimeout(() => {
          onNext();
        }, 100);
      }
    } else {
      onNext();
    }
  };

  // Check if we're on a mobile device in PWA mode for styling
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isStandalone = typeof window !== 'undefined' && 
                      (window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true);
  const isMobilePwa = isStandalone && isMobile;
  
  // For mobile PWA, use larger buttons
  const nextButtonClass = isMobilePwa
    ? "bg-triage-purple hover:bg-triage-purple/90 text-white py-3"
    : "bg-triage-purple hover:bg-triage-purple/90 text-white";
  
  const backButtonClass = isMobilePwa
    ? "border-gray-200 py-3"
    : "border-gray-200";

  return (
    <div className="flex justify-between mt-8">
      <Button
        variant="outline"
        onClick={onBack}
        className={backButtonClass}
        size={isMobilePwa ? "default" : "sm"}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <Button 
        onClick={handleNext}
        className={nextButtonClass}
        disabled={!canProceed}
        size={isMobilePwa ? "default" : "sm"}
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
