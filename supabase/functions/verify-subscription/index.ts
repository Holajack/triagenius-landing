
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
      // Return a successful response with free tier info instead of an error
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: 'free'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
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
      // Return free tier instead of throwing an error
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: 'free'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const token = authHeader.replace('Bearer ', '');
    log('Authenticating user with token');
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      log('Error getting user', userError);
      // Return free tier instead of throwing an error
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: 'free'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    log('User authenticated successfully', { userId: user.id, email: user.email });

    try {
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
        try {
          await supabaseClient.from('subscribers').upsert({
            user_id: user.id,
            email: user.email,
            subscribed: false,
            subscription_tier: 'free',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        } catch (dbError) {
          log('Error updating subscriber in database (non-critical)', dbError);
          // Continue even if database update fails
        }

        return new Response(JSON.stringify({ 
          subscribed: false,
          subscription_tier: 'free'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      log('Found Stripe customer', { customerId });
      
      try {
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

        try {
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
        } catch (dbError) {
          log('Error updating subscriber in database (non-critical)', dbError);
          // Continue even if database update fails
        }

        return new Response(JSON.stringify({
          subscribed: isActive || isTrialing,
          subscription_tier: (isActive || isTrialing) ? 'premium' : 'free',
          is_trial: isTrialing,
          trial_end: trialEnd,
          subscription_end: subscriptionEnd,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (stripeError) {
        log('Error fetching subscriptions from Stripe', stripeError);
        // Return free tier on Stripe API errors
        return new Response(JSON.stringify({ 
          subscribed: false,
          subscription_tier: 'free'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (stripeError) {
      log('Error checking Stripe customer', stripeError);
      // Return free tier on Stripe API errors
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: 'free'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    log('Error in verify-subscription function', { 
      message: error.message || 'Unknown error', 
      stack: error.stack 
    });
    
    // Return free tier instead of an error status
    return new Response(JSON.stringify({ 
      subscribed: false,
      subscription_tier: 'free'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 with free tier data instead of 500 error
    });
  }
});
