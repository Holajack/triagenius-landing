
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import QuickStartButton from "@/components/dashboard/QuickStartButton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CompletedOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
               (window.navigator as any).standalone === true;
  
  useEffect(() => {
    // Show success toast when onboarding is complete
    toast.success("Welcome to The Triage System!", {
      description: "Your personalized focus experience is ready.",
      icon: <CheckCircle2 className="text-green-500" />,
    });
    
    // Auto-navigate to dashboard after a short delay
    if (isPwa) {
      const timer = setTimeout(() => {
        console.log('CompletedOnboarding: Auto-navigating to dashboard');
        navigate('/dashboard');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [navigate, isPwa]);
  
  const handleNavigate = () => {
    console.log('CompletedOnboarding: Manually navigating to dashboard');
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="mt-8 mb-12 text-center">
          <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-center">Setup Complete!</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Your personalized focus environment is ready. Start your first session to begin your productivity journey.
          </p>
        </div>
        
        <div className="space-y-8">
          <div className="mt-8">
            <QuickStartButton />
          </div>
          
          <div className="flex justify-center mt-8">
            <Button 
              variant="outline" 
              onClick={handleNavigate}
              className="px-6"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedOnboarding;
