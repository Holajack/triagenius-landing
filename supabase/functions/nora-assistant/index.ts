
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

    log('Received message for Nora', { userId, messageLength: message.length });
    
    try {
      // Call the Nora API with proper error handling and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('https://api.nora-assistant.com/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${noraApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId || 'anonymous',
          message: message,
          options: {
            context: "focus-app",
            tone: "supportive"
          }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        log('Nora API error response', { 
          status: response.status, 
          statusText: response.statusText,
          body: errorText 
        });
        
        // Return a fallback response with error details
        return new Response(
          JSON.stringify({
            response: "I'm having trouble connecting to my knowledge base right now. Please try again in a few moments.",
            suggestions: ["Try again later", "Ask a different question", "Contact support if the issue persists"],
            error: `API returned status ${response.status}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
    } catch (apiError) {
      // Handle network or timeout errors specifically
      log('Nora API connection error', { message: apiError.message, name: apiError.name });
      
      // Return a graceful fallback response
      return new Response(
        JSON.stringify({ 
          response: "I'm having trouble connecting right now. This could be due to network issues or my service might be temporarily unavailable. Please try again shortly.",
          suggestions: ["Try again in a few moments", "Check your internet connection", "Refresh the page"],
          error: apiError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    log('Error in nora-assistant function', { message: error.message, stack: error.stack });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "Sorry, I'm having trouble understanding right now. Please try again later."
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
