
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";

export const PostSignupPlans = () => {
  const navigate = useNavigate();
  const { startCheckout } = useSubscription();

  const handleStartFree = () => {
    toast.success("Welcome to your free account!");
    navigate("/onboarding");
  };

  const handleUpgrade = async () => {
    try {
      const result = await startCheckout();
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error("Could not start checkout process");
      }
    } catch (error) {
      console.error("Error starting checkout:", error);
      toast.error("Failed to start checkout process");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2">Choose Your Plan</h1>
      <p className="text-center text-gray-600 mb-8">
        Start with a free account or unlock all features with Premium
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <Card className="p-6 border-2">
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-2">Free</h3>
            <div className="text-4xl font-bold mb-6">$0<span className="text-lg font-normal text-gray-600">/mo</span></div>
          </div>
          <div className="space-y-4 mb-8">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>Basic focus sessions</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>Standard analytics</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>Community access</span>
            </div>
          </div>
          <Button 
            className="w-full" 
            variant="outline"
            onClick={handleStartFree}
          >
            Start Free
          </Button>
        </Card>

        {/* Premium Plan */}
        <Card className="p-6 border-2 border-purple-200 bg-purple-50/50">
          <div className="text-center">
            <div className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">RECOMMENDED</div>
            <h3 className="text-2xl font-semibold mb-2">Premium</h3>
            <div className="text-4xl font-bold mb-6">$9.99<span className="text-lg font-normal text-gray-600">/mo</span></div>
          </div>
          <div className="space-y-4 mb-8">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>Everything in Free plan</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>Advanced focus tracking</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>AI-powered insights</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>Priority support</span>
            </div>
          </div>
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleUpgrade}
          >
            Start Free Trial
          </Button>
          <p className="text-sm text-center mt-4 text-gray-600">14-day free trial, cancel anytime</p>
        </Card>
      </div>
    </div>
  );
};
