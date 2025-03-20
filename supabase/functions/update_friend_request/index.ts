
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Parse request body
    const { requestId, status } = await req.json();
    
    if (!requestId || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Check if this is a sample/mock ID for preview mode
    if (requestId.toString().startsWith('fr-') || requestId.toString().startsWith('sample-')) {
      console.log("Sample request ID detected, returning mock response");
      return new Response(
        JSON.stringify({
          friendRequest: {
            id: requestId,
            status: status,
            updated_at: new Date().toISOString()
          }
        }),
        { status: 200, headers: corsHeaders }
      );
    }
    
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Update the friend request status
    const { data: friendRequest, error } = await supabase
      .from('friend_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating friend request:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    return new Response(
      JSON.stringify({ friendRequest }),
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
