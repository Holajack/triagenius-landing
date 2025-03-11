
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserGoalStep } from "@/components/onboarding/steps/UserGoalStep";
import { WorkStyleStep } from "@/components/onboarding/steps/WorkStyleStep";
import { EnvironmentStep } from "@/components/onboarding/steps/EnvironmentStep";
import { SoundStep } from "@/components/onboarding/steps/SoundStep";
import { SummaryStep } from "@/components/onboarding/steps/SummaryStep";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const Onboarding = () => {
  const { state, dispatch } = useOnboarding();
  const navigate = useNavigate();

  // Reset onboarding state when component mounts
  useEffect(() => {
    dispatch({ type: 'RESET_ONBOARDING' });
  }, [dispatch]);

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
      
      // Show success toast when onboarding is complete
      toast.success("Onboarding complete! Your preferences have been saved.", {
        description: "Your personalized focus experience is ready.",
        icon: <CheckCircle2 className="text-green-500" />,
      });
      
      // Navigate to the dashboard after completion
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (state.step > 0) {
      dispatch({ type: 'SET_STEP', payload: state.step - 1 });
    } else {
      navigate('/');
    }
  };

  const canProceed = () => {
    switch (state.step) {
      case 0: return !!state.userGoal;
      case 1: return !!state.workStyle;
      case 2: return !!state.environment;
      case 3: return !!state.soundPreference;
      default: return true;
    }
  };

  if (state.isComplete) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <div className="pt-6 pb-4 border-b">
          <h2 className="text-2xl font-semibold text-center mb-4">
            {steps[state.step].title}
          </h2>
          <div className="flex gap-1 justify-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-16 rounded-full transition-colors ${
                  index < state.step ? 'bg-triage-purple' : 
                  index === state.step ? 'bg-triage-purple shadow-sm' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="py-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={state.step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CurrentStep />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-gray-200"
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
    </div>
  );
};

export default Onboarding;
