
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

interface WebhookPayload {
  userId: string;
  metrics?: {
    cognitive_memory: any[];
    cognitive_problem_solving: any[];
    cognitive_creativity: any[];
    cognitive_analytical: any[];
    weekly_data: any[];
    growth_data: any[];
    focus_distribution: any[];
    focus_trends: any[];
    time_of_day_data: any[];
  };
  action?: string;
}

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
    // Get credentials from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const payload: WebhookPayload = await req.json();
    const { userId, metrics, action } = payload;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), { 
        status: 400, 
        headers: corsHeaders
      });
    }
    
    // Handle GET request (retrieve metrics)
    if (req.method === 'GET' || action === 'get') {
      const { data, error } = await supabase.from('learning_metrics').select('*').eq('user_id', userId).maybeSingle();
      
      if (error) {
        console.error('Error retrieving learning metrics:', error);
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500,
          headers: corsHeaders
        });
      }
      
      return new Response(JSON.stringify({ success: true, data }), { 
        status: 200,
        headers: corsHeaders
      });
    }
    
    // Handle POST request (update metrics)
    if (!metrics) {
      return new Response(JSON.stringify({ error: "Missing metrics data" }), { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Check if record exists
    const { data: existingRecord, error: queryError } = await supabase
      .from('learning_metrics')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (queryError) {
      console.error('Error checking existing record:', queryError);
      return new Response(JSON.stringify({ error: queryError.message }), { 
        status: 500,
        headers: corsHeaders
      });
    }
    
    let result;
    
    if (existingRecord) {
      // Update existing record
      result = await supabase
        .from('learning_metrics')
        .update(metrics)
        .eq('user_id', userId);
    } else {
      // Insert new record
      result = await supabase
        .from('learning_metrics')
        .insert({
          user_id: userId,
          ...metrics
        });
    }
    
    if (result.error) {
      console.error('Error updating learning metrics:', result.error);
      return new Response(JSON.stringify({ error: result.error.message }), { 
        status: 500,
        headers: corsHeaders
      });
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500,
      headers: corsHeaders
    });
  }
});
