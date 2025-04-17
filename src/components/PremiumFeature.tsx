
import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface PremiumFeatureProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const PremiumFeature = ({ children, fallback }: PremiumFeatureProps) => {
  const { tier, startCheckout, isLoading } = useSubscription();

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (tier === 'premium') {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="p-4 text-center space-y-4">
      <div className="flex justify-center">
        <Lock className="w-12 h-12 text-purple-500" />
      </div>
      <h3 className="text-lg font-semibold">Premium Feature</h3>
      <p className="text-sm text-gray-600">
        Upgrade to Premium to unlock this feature and many more!
      </p>
      <Button onClick={startCheckout} variant="default">
        Upgrade to Premium
      </Button>
    </Card>
  );
};
