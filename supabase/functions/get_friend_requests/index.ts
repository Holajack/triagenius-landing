
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
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing user ID" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Check if we're in preview mode with sample IDs
    if (userId.toString().startsWith('sample-')) {
      console.log("Sample user ID detected, returning empty friend requests array");
      return new Response(
        JSON.stringify({ friendRequests: [] }),
        { status: 200, headers: corsHeaders }
      );
    }
    
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch all friend requests where the user is either sender or recipient
    const { data: friendRequests, error } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
      
    if (error) {
      console.error('Error fetching friend requests:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log(`Fetched ${friendRequests?.length || 0} friend requests for user ${userId}`);
    
    return new Response(
      JSON.stringify({ friendRequests: friendRequests || [] }),
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
