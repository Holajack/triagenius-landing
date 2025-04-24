
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Use your Premium plan price ID
const PREMIUM_PRICE_ID = 'price_1REtLZRxJNzEBztC5wnZatww';

// Helper function for logging with timestamps
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : '');
};

serve(async (req) => {
  log('Received checkout request');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('Parsing request body');
    const { email } = await req.json();
    
    if (!email) {
      log('Error: No email provided in request');
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    log('Looking for existing customer', { email });
    // Check if customer exists
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId = customers.data[0]?.id;
    
    // Create customer if they don't exist
    if (!customerId) {
      log('Creating new customer', { email });
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
      log('Customer created', { customerId });
    } else {
      log('Found existing customer', { customerId });
    }

    log('Creating checkout session', { customerId, priceId: PREMIUM_PRICE_ID });
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14,
      },
      success_url: `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/dashboard`,
    });

    log('Checkout session created successfully', { sessionId: session.id, url: session.url });
    
    if (!session.url) {
      log('Error: Stripe did not return a session URL');
      return new Response(JSON.stringify({ error: 'Stripe checkout URL not generated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log('Error in checkout process', { error: error.message, stack: error.stack });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
