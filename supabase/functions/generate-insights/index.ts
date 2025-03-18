
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Get URL and service role key from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing user ID" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Get user's focus session data
    const { data: focusSessions, error: focusError } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (focusError) {
      console.error('Error fetching focus sessions:', focusError);
      return new Response(
        JSON.stringify({ error: focusError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Get user's preferences
    const { data: preferences, error: prefError } = await supabase
      .from('onboarding_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (prefError && prefError.code !== 'PGRST116') {
      console.error('Error fetching user preferences:', prefError);
    }
    
    // Create prompt for OpenAI based on user data
    let prompt = "Generate three AI-powered insights for a focus app user based on their data:\n\n";
    
    if (focusSessions && focusSessions.length > 0) {
      prompt += `The user has completed ${focusSessions.length} focus sessions.\n`;
      
      // Calculate total focus time
      const totalMinutes = focusSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
      prompt += `Their total focus time is approximately ${totalHours} hours.\n`;
      
      // Find patterns in focus times
      const morningCount = focusSessions.filter(s => {
        const hour = new Date(s.start_time).getHours();
        return hour >= 5 && hour < 12;
      }).length;
      
      const afternoonCount = focusSessions.filter(s => {
        const hour = new Date(s.start_time).getHours();
        return hour >= 12 && hour < 17;
      }).length;
      
      const eveningCount = focusSessions.filter(s => {
        const hour = new Date(s.start_time).getHours();
        return hour >= 17 && hour < 22;
      }).length;
      
      prompt += `They tend to focus most during: ${
        morningCount > afternoonCount && morningCount > eveningCount ? 'mornings' :
        afternoonCount > morningCount && afternoonCount > eveningCount ? 'afternoons' :
        'evenings'
      }.\n`;
      
      // Add environment info
      const environments = focusSessions
        .map(s => s.environment)
        .filter(e => e !== null);
        
      if (environments.length > 0) {
        const commonEnv = [...environments].sort((a, b) => 
          environments.filter(v => v === a).length - environments.filter(v => v === b).length
        ).pop();
        
        prompt += `They often work in a ${commonEnv} environment.\n`;
      }
    } else {
      prompt += "The user is new and hasn't completed any focus sessions yet.\n";
    }
    
    // Add preference data if available
    if (preferences) {
      prompt += `Their weekly focus goal is ${preferences.weekly_focus_goal || 10} hours.\n`;
      if (preferences.user_goal) prompt += `Their primary goal is: ${preferences.user_goal}.\n`;
      if (preferences.work_style) prompt += `Their work style is: ${preferences.work_style}.\n`;
      if (preferences.learning_environment) prompt += `Their preferred environment is: ${preferences.learning_environment}.\n`;
      if (preferences.sound_preference) prompt += `Their sound preference is: ${preferences.sound_preference}.\n`;
    }
    
    prompt += "\nPlease provide three specific, actionable insights that would help this user improve their focus and productivity. Each insight should have a short title (3-5 words) and a brief description (1-2 sentences). Format the response as a JSON array with objects containing 'title' and 'description' fields. Do not include any other text outside this JSON array.";
    
    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that provides insights for users of a focus and productivity app."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    // Parse OpenAI response
    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices || openaiData.choices.length === 0) {
      console.error('Invalid OpenAI response:', openaiData);
      return new Response(
        JSON.stringify({ error: "Failed to generate insights" }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Extract insights from OpenAI response
    let insights;
    try {
      const content = openaiData.choices[0].message.content;
      insights = JSON.parse(content);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return new Response(
        JSON.stringify({ error: "Failed to parse insights" }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Return insights
    return new Response(
      JSON.stringify({ insights }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
