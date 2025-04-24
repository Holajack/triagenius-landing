
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './use-user';
import { toast } from 'sonner';
import { useAdmin } from './use-admin';

export type SubscriptionTier = 'free' | 'premium';

interface SubscriptionState {
  isLoading: boolean;
  subscribed: boolean;
  tier: SubscriptionTier;
  isTrial: boolean;
  trialEnd: Date | null;
  subscriptionEnd: Date | null;
}

interface CheckoutResult {
  url: string | null;
  error?: string;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    subscribed: false,
    tier: 'free',
    isTrial: false,
    trialEnd: null,
    subscriptionEnd: null,
  });
  const { user } = useUser();
  const { isAdmin } = useAdmin();

  const checkSubscription = async () => {
    if (!user?.email) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      if (isAdmin) {
        setState({
          isLoading: false,
          subscribed: true,
          tier: 'premium',
          isTrial: false,
          trialEnd: null,
          subscriptionEnd: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('verify-subscription');
      
      if (error) throw error;
      
      setState({
        isLoading: false,
        subscribed: data.subscribed,
        tier: data.subscription_tier,
        isTrial: data.is_trial,
        trialEnd: data.trial_end ? new Date(data.trial_end) : null,
        subscriptionEnd: data.subscription_end ? new Date(data.subscription_end) : null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast.error('Failed to verify subscription status');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const startCheckout = async (): Promise<CheckoutResult> => {
    if (!user?.email) {
      toast.error('Please log in to subscribe');
      return { url: null, error: 'User not logged in' };
    }

    try {
      console.log('Starting checkout process for email:', user.email);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { email: user.email },
      });

      if (error) {
        console.error('Error from create-checkout function:', error);
        throw error;
      }
      
      if (!data || !data.url) {
        console.error('No checkout URL returned:', data);
        throw new Error('Checkout session URL not returned');
      }
      
      console.log('Received checkout URL:', data.url);
      return { url: data.url };
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast.error('Failed to start checkout process: ' + (error.message || 'Unknown error'));
      return { url: null, error: error.message || 'Failed to create checkout session' };
    }
  };

  const openCustomerPortal = async (): Promise<CheckoutResult> => {
    if (!user?.email) return { url: null, error: 'User not logged in' };

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { email: user.email },
      });

      if (error) throw error;
      return { url: data?.url || null };
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management');
      return { url: null, error: error.message };
    }
  };

  useEffect(() => {
    if (user?.email || isAdmin) {
      checkSubscription();
    }
  }, [user?.email, isAdmin]);

  return {
    ...state,
    startCheckout,
    openCustomerPortal,
    checkSubscription,
  };
}
