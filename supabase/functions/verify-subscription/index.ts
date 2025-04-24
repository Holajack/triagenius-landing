
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for logging
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : '');
};

serve(async (req) => {
  log('Verify subscription request received');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe secret key from environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      log('Error: STRIPE_SECRET_KEY environment variable not set');
      return new Response(JSON.stringify({ error: 'Server configuration error: Stripe key not available' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Initialize Stripe with the secret key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      log('Error: No authorization header provided');
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    log('Authenticating user with token');
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      log('Error getting user', userError);
      throw new Error('Error getting user');
    }
    
    log('User authenticated successfully', { userId: user.id, email: user.email });

    // Get customer data
    log('Checking for Stripe customer with email', { email: user.email });
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    const customerId = customers.data[0]?.id;
    if (!customerId) {
      log('No Stripe customer found, returning free tier', { email: user.email });
      
      // No subscription found, update database
      await supabaseClient.from('subscribers').upsert({
        user_id: user.id,
        email: user.email,
        subscribed: false,
        subscription_tier: 'free',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: 'free'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log('Found Stripe customer', { customerId });
    
    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 5,
    });

    log('Retrieved subscriptions', { count: subscriptions.data.length });
    
    // Look for active or trialing subscription
    const activeSubscription = subscriptions.data.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    );
    
    const isTrialing = activeSubscription?.status === 'trialing';
    const isActive = activeSubscription?.status === 'active';
    const trialEnd = activeSubscription?.trial_end ? new Date(activeSubscription.trial_end * 1000) : null;
    const subscriptionEnd = activeSubscription?.current_period_end ? new Date(activeSubscription.current_period_end * 1000) : null;

    log('Subscription status', { 
      isActive, 
      isTrialing, 
      trialEnd: trialEnd?.toISOString(), 
      subscriptionEnd: subscriptionEnd?.toISOString() 
    });

    // Update database
    await supabaseClient.from('subscribers').upsert({
      user_id: user.id,
      email: user.email,
      stripe_customer_id: customerId,
      subscribed: isActive || isTrialing,
      subscription_tier: (isActive || isTrialing) ? 'premium' : 'free',
      is_trial: isTrialing,
      trial_end: trialEnd?.toISOString(),
      subscription_end: subscriptionEnd?.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    log('Updated subscriber record in database');

    return new Response(JSON.stringify({
      subscribed: isActive || isTrialing,
      subscription_tier: (isActive || isTrialing) ? 'premium' : 'free',
      is_trial: isTrialing,
      trial_end: trialEnd,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log('Error in verify-subscription function', { 
      message: error.message || 'Unknown error', 
      stack: error.stack 
    });
    
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
