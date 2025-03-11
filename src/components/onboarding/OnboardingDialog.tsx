
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Button } from "@/components/ui/button";
import { UserGoalStep } from "@/components/onboarding/steps/UserGoalStep";
import { WorkStyleStep } from "@/components/onboarding/steps/WorkStyleStep";
import { EnvironmentStep } from "@/components/onboarding/steps/EnvironmentStep";
import { SoundStep } from "@/components/onboarding/steps/SoundStep";
import { SummaryStep } from "@/components/onboarding/steps/SummaryStep";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OnboardingDialog = ({ open, onOpenChange }: OnboardingDialogProps) => {
  const { state, dispatch } = useOnboarding();
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');

  // Reset onboarding state when dialog opens
  useEffect(() => {
    if (open) {
      dispatch({ type: 'RESET_ONBOARDING' });
    }
  }, [open, dispatch]);

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
      setSlideDirection('right');
      dispatch({ type: 'SET_STEP', payload: state.step + 1 });
    } else {
      dispatch({ type: 'COMPLETE_ONBOARDING' });
      onOpenChange(false);
      
      // Show success toast when onboarding is complete
      toast.success("Onboarding complete! Your preferences have been saved.", {
        description: "Your personalized focus experience is ready.",
        icon: <CheckCircle2 className="text-green-500" />,
      });
    }
  };

  const handleBack = () => {
    if (state.step > 0) {
      setSlideDirection('left');
      dispatch({ type: 'SET_STEP', payload: state.step - 1 });
    }
  };

  if (state.isComplete) return null;

  const canProceed = () => {
    switch (state.step) {
      case 0: return !!state.userGoal;
      case 1: return !!state.workStyle;
      case 2: return !!state.environment; 
      case 3: return !!state.soundPreference;
      default: return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white max-h-[90vh] w-[95vw] sm:w-auto">
        <div className="relative pb-6 flex flex-col h-full">
          <div className="pt-6 pb-4 px-4 sm:px-6 border-b">
            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-4">
              {steps[state.step].title}
            </h2>
            <div className="flex gap-1 justify-center">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-12 sm:w-16 rounded-full transition-colors ${
                    index < state.step ? 'bg-triage-purple' : 
                    index === state.step ? 'bg-triage-purple shadow-sm' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-grow">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={state.step}
                initial={{ 
                  x: slideDirection === 'right' ? 20 : -20, 
                  opacity: 0 
                }}
                animate={{ 
                  x: 0, 
                  opacity: 1 
                }}
                exit={{ 
                  x: slideDirection === 'right' ? -20 : 20, 
                  opacity: 0 
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full min-h-[250px] sm:min-h-[300px] flex items-center justify-center"
              >
                <CurrentStep />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-between px-4 sm:px-6 py-4 mt-auto border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              className={`${state.step === 0 ? 'invisible' : ''} border-gray-200`}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button 
              onClick={handleNext}
              className="bg-triage-purple hover:bg-triage-purple/90 text-white"
              disabled={!canProceed()}
              size="sm"
            >
              {state.step === steps.length - 1 ? (
                'Complete'
              ) : (
                <>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
