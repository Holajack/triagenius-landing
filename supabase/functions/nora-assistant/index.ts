
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for logging with timestamps
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const noraApiKey = Deno.env.get('NORA_API_KEY');
    
    if (!noraApiKey) {
      log('Error: NORA_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({ error: 'Nora API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, userId } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('Received message for Nora', { userId });
    
    // Call the Nora API (replace with actual Nora API endpoint)
    const response = await fetch('https://api.nora-assistant.com/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${noraApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        message: message,
        options: {
          context: "focus-app",
          tone: "supportive"
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      log('Nora API error', { status: response.status, body: errorData });
      throw new Error(`Nora API returned ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    log('Nora response received', { responseLength: data?.response?.length || 0 });

    return new Response(
      JSON.stringify({ 
        response: data.response,
        suggestions: data.suggestions || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    log('Error in nora-assistant function', { message: error.message, stack: error.stack });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "Sorry, I'm having trouble understanding right now. Please try again later."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
