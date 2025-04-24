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
      console.log('Checking subscription for user:', user.email);
      setState(prev => ({ ...prev, isLoading: true }));
      
      if (isAdmin) {
        console.log('User is admin, setting premium subscription');
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
      
      if (error) {
        console.error('Error from verify-subscription function:', error);
        setState({
          isLoading: false,
          subscribed: false,
          tier: 'free',
          isTrial: false,
          trialEnd: null,
          subscriptionEnd: null,
        });
        toast.error('Failed to verify subscription status. Defaulting to free tier.');
        return;
      }
      
      if (!data) {
        console.error('No data returned from verify-subscription function');
        setState({
          isLoading: false,
          subscribed: false,
          tier: 'free',
          isTrial: false,
          trialEnd: null,
          subscriptionEnd: null,
        });
        return;
      }
      
      console.log('Subscription check result:', data);
      
      setState({
        isLoading: false,
        subscribed: data.subscribed,
        tier: data.subscription_tier || 'free',
        isTrial: data.is_trial || false,
        trialEnd: data.trial_end ? new Date(data.trial_end) : null,
        subscriptionEnd: data.subscription_end ? new Date(data.subscription_end) : null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setState({
        isLoading: false,
        subscribed: false,
        tier: 'free',
        isTrial: false,
        trialEnd: null,
        subscriptionEnd: null,
      });
      toast.error('Failed to verify subscription status. Defaulting to free tier.');
    }
  };

  const startCheckout = async (): Promise<CheckoutResult> => {
    if (!user?.email) {
      toast.error('Please log in to subscribe');
      return { url: null, error: 'User not logged in' };
    }

    try {
      console.log('Starting checkout process for email:', user.email);
      setState(prev => ({ ...prev, isLoading: true }));
      
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
      setState(prev => ({ ...prev, isLoading: false }));
      return { url: null, error: error.message || 'Failed to create checkout session' };
    }
  };

  const openCustomerPortal = async (): Promise<CheckoutResult> => {
    if (!user?.email) {
      toast.error('Please log in to manage your subscription');
      return { url: null, error: 'User not logged in' };
    }

    try {
      console.log('Opening customer portal for user:', user.email);
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { email: user.email },
      });

      if (error) {
        console.error('Error from customer-portal function:', error);
        throw error;
      }
      
      if (!data?.url) {
        console.error('No portal URL returned:', data);
        throw new Error('Customer portal URL not returned');
      }
      
      return { url: data.url };
    } catch (error) {
      console.error('Error opening customer portal:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return { url: null, error: error.message };
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    if (user?.email || isAdmin) {
      checkSubscription().catch(err => {
        console.error('Subscription check failed in effect:', err);
        setState({
          isLoading: false,
          subscribed: false,
          tier: 'free',
          isTrial: false,
          trialEnd: null,
          subscriptionEnd: null,
        });
      });
    } else {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        subscribed: false,
        tier: 'free'
      }));
    }
  }, [user?.email, isAdmin]);

  return {
    ...state,
    startCheckout,
    openCustomerPortal,
    checkSubscription,
  };
}
