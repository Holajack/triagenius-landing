
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Crown } from 'lucide-react';

const SubscriptionPage = () => {
  const { tier, startCheckout, openCustomerPortal, isLoading } = useSubscription();

  const plans = [
    {
      name: 'Free',
      price: '$0/month',
      features: [
        'Basic task tracking',
        'Core focus timer',
        'Limited analytics',
      ],
      current: tier === 'free'
    },
    {
      name: 'Premium',
      price: '$9.99/month',
      features: [
        'Everything in Free',
        'Advanced analytics',
        'AI-powered insights',
        'Custom sound library',
        'Unlimited study rooms',
      ],
      current: tier === 'premium'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Subscription Plans</h1>
          <p className="text-gray-600">Choose the plan that best fits your needs</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={`p-6 ${plan.current ? 'border-purple-500 border-2' : ''}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{plan.name}</h2>
                {plan.current && (
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.name === 'Premium' && (
                  <span className="text-sm text-gray-500 ml-2">
                    (14-day free trial)
                  </span>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-purple-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.name === 'Premium' && tier === 'free' && (
                <Button 
                  onClick={startCheckout} 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Start Free Trial'}
                </Button>
              )}
              {plan.current && tier === 'premium' && (
                <Button 
                  onClick={openCustomerPortal} 
                  variant="outline" 
                  className="w-full"
                  disabled={isLoading}
                >
                  Manage Subscription
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
