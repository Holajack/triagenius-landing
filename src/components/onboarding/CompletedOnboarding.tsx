
import React from "react";
import QuickStartButton from "@/components/dashboard/QuickStartButton";

const CompletedOnboarding: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Ready to Get Started</h1>
        
        <div className="space-y-8">
          <div className="mt-12">
            <QuickStartButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedOnboarding;
