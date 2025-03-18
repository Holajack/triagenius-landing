
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import OnboardingHeader from "./OnboardingHeader";
import OnboardingNavigation from "./OnboardingNavigation";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  title: string;
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onNext: () => void;
  onBack: () => void;
  userData?: { email: string; username: string } | null;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ 
  children,
  title,
  currentStep,
  totalSteps,
  canProceed,
  onNext,
  onBack,
  userData
}) => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <OnboardingHeader 
          title={title} 
          currentStep={currentStep} 
          totalSteps={totalSteps}
          userData={userData}
        />

        <div className="py-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        <OnboardingNavigation 
          currentStep={currentStep}
          totalSteps={totalSteps}
          canProceed={canProceed}
          onNext={onNext}
          onBack={onBack}
        />
      </div>
    </div>
  );
};

export default OnboardingLayout;
