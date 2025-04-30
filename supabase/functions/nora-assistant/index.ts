
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Helper function for logging with timestamps
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : '');
};

// The documented Nora API endpoint
const NORA_API_URL = "https://api.nora-assistant.com/v1/chat";

// The name of the OpenAI assistant
const ASSISTANT_NAME = "Nora";

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

    const { message, userId, assistantName } = await req.json();
    const effectiveAssistantName = assistantName || ASSISTANT_NAME;
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('Received message for Nora', { userId, messageLength: message.length, assistantName: effectiveAssistantName });
    
    try {
      // Call the Nora API with proper error handling and timeout
      const timeoutId = setTimeout(() => {
        log('Request timed out');
      }, 20000); // 20 second timeout for logging
      
      log('Sending request to Nora API', { endpoint: NORA_API_URL });
      const response = await fetch(NORA_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${noraApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'FocusApp-Supabase/1.0',
        },
        body: JSON.stringify({
          user_id: userId || 'anonymous',
          message: message,
          options: {
            context: "focus-app",
            tone: "supportive",
            assistant_name: effectiveAssistantName
          }
        }),
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
            response: "I'm having trouble accessing my knowledge base. This could be a temporary issue. Let's try again in a moment.",
            suggestions: ["Try again later", "Ask a different question", "Check if there's a service status update"],
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
      log('Nora API connection error', { 
        message: apiError.message, 
        name: apiError.name,
        stack: apiError.stack
      });
      
      const isAbortError = apiError.name === 'AbortError';
      
      // Return a graceful fallback response
      return new Response(
        JSON.stringify({ 
          response: isAbortError 
            ? "My response timed out. This could be due to high traffic or connectivity issues. Please try again shortly."
            : "I'm having trouble connecting right now. My service might be temporarily unavailable. Please try again in a few minutes.",
          suggestions: [
            "Try again shortly", 
            "Ask a simpler question", 
            "Check your internet connection"
          ],
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
        response: "I encountered an unexpected issue. Please try refreshing the page and asking again."
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
