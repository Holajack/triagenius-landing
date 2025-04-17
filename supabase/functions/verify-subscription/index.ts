
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) throw new Error('Error getting user');

    // Get customer data
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    const customerId = customers.data[0]?.id;
    if (!customerId) {
      // No subscription found, update database
      await supabaseClient.from('subscribers').upsert({
        user_id: user.id,
        email: user.email,
        subscribed: false,
        subscription_tier: 'free',
        updated_at: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: 'free'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    const subscription = subscriptions.data[0];
    const isTrialing = subscription?.status === 'trialing';
    const isActive = subscription?.status === 'active';
    const trialEnd = subscription?.trial_end ? new Date(subscription.trial_end * 1000) : null;
    const subscriptionEnd = subscription?.current_period_end ? new Date(subscription.current_period_end * 1000) : null;

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
    });

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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
