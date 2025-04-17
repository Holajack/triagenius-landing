
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Subscription = () => {
  const { startCheckout, tier, isLoading } = useSubscription();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    try {
      const result = await startCheckout();
      // Check if result exists and has a url property before trying to use it
      if (result && result.url) {
        window.location.href = result.url;
      } else {
        toast.error('Checkout session URL not returned');
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast.error('Failed to start checkout process');
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-8">Choose Your Plan</h1>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Unlock premium features and take your focus to the next level
      </p>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Free Plan */}
        <Card className="p-6 border-2 border-gray-200">
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
            onClick={() => navigate('/dashboard')}
          >
            Current Plan
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
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Start Free Trial"}
          </Button>
          <p className="text-sm text-center mt-4 text-gray-600">14-day free trial, cancel anytime</p>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
