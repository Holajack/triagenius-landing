
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, sessionData, taskData } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a system prompt for OpenAI to understand the context
    const systemPrompt = `
      You are an AI assistant that analyzes learning and productivity data.
      Based on the user's focus sessions and tasks, generate insights about:
      1. Cognitive patterns (memory, problem solving, creativity, analytical thinking)
      2. Focus distribution across different activities
      3. Productivity trends over time
      4. Optimal learning times and environments
      
      Format your response as a JSON with the following structure:
      {
        "cognitivePatterns": {
          "memory": [{"value": number, "prevValue": number, "color": string}],
          "problemSolving": [{"value": number, "prevValue": number, "color": string}],
          "creativity": [{"value": number, "prevValue": number, "color": string}],
          "analytical": [{"value": number, "prevValue": number, "color": string}]
        },
        "weeklyData": [{day: string, memory: number, problemSolving: number, creativity: number, analytical: number}],
        "growthData": [{week: string, cognitive: number}],
        "focusDistribution": [{name: string, value: number, color: string}],
        "focusTrends": [{week: string, hours: number}],
        "timeOfDay": [{time: string, score: number}]
      }
    `;

    // Format the session and task data
    const userPrompt = `
      Here is the user's data:
      Focus Sessions: ${JSON.stringify(sessionData)}
      Tasks: ${JSON.stringify(taskData)}
      
      Based on this data, generate the metrics as specified in the system prompt.
      If there's not enough data, make reasonable estimates based on the limited information available.
    `;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API returned an error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const generatedInsights = data.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      const parsedInsights = JSON.parse(generatedInsights);
      
      return new Response(
        JSON.stringify({ insights: parsedInsights }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Error parsing OpenAI response as JSON:', parseError);
      console.log('Raw OpenAI response:', generatedInsights);
      
      // Return a simplified fallback response
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response', 
          rawResponse: generatedInsights 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in generate-learning-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
