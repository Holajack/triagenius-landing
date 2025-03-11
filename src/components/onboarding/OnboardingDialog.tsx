
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Button } from "@/components/ui/button";
import { UserGoalStep } from "@/components/onboarding/steps/UserGoalStep";
import { WorkStyleStep } from "@/components/onboarding/steps/WorkStyleStep";
import { EnvironmentStep } from "@/components/onboarding/steps/EnvironmentStep";
import { SoundStep } from "@/components/onboarding/steps/SoundStep";
import { SummaryStep } from "@/components/onboarding/steps/SummaryStep";

export const OnboardingDialog = () => {
  const [open, setOpen] = useState(true);
  const { state, dispatch } = useOnboarding();

  const steps = [
    { component: UserGoalStep, title: "What's your main goal?" },
    { component: WorkStyleStep, title: "How do you prefer to work?" },
    { component: EnvironmentStep, title: "Choose your environment" },
    { component: SoundStep, title: "Select your sound preference" },
    { component: SummaryStep, title: "Your personalized setup" },
  ];

  const CurrentStep = steps[state.step].component;
  
  const handleNext = () => {
    if (state.step < steps.length - 1) {
      dispatch({ type: 'SET_STEP', payload: state.step + 1 });
    } else {
      dispatch({ type: 'COMPLETE_ONBOARDING' });
      setOpen(false);
    }
  };

  const handleBack = () => {
    if (state.step > 0) {
      dispatch({ type: 'SET_STEP', payload: state.step - 1 });
    }
  };

  if (!open || state.isComplete) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <div className="relative">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-center mb-2">
              {steps[state.step].title}
            </h2>
            <div className="flex gap-1 justify-center mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 w-16 rounded-full transition-colors ${
                    index <= state.step ? 'bg-triage-purple' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <CurrentStep />

          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className={state.step === 0 ? 'invisible' : ''}
            >
              Back
            </Button>
            <Button onClick={handleNext}>
              {state.step === steps.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
