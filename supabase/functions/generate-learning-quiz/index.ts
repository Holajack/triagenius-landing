
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The function is essentially a placeholder since questions are defined client-side
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quizType, userId } = await req.json();
    
    if (!quizType || !userId) {
      return new Response(
        JSON.stringify({ error: 'Quiz type and user ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // The new quiz format doesn't use the OpenAI API to generate questions,
    // but we'll keep this endpoint for compatibility with any existing code
    // that might be calling it
    
    // Return an empty array since we're not using dynamically generated questions anymore
    return new Response(
      JSON.stringify({ 
        questions: [],
        message: "Questions are now defined client-side in the LearningQuiz component"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-learning-quiz function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
