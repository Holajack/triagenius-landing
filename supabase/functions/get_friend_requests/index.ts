
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
    // Get Supabase credentials from environment
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
    
    // Fetch all friend requests where user is sender or recipient
    const { data: sentRequests, error: sentError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('sender_id', userId);
      
    if (sentError) {
      console.error('Error fetching sent requests:', sentError);
      return new Response(
        JSON.stringify({ error: sentError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    const { data: receivedRequests, error: receivedError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('recipient_id', userId);
      
    if (receivedError) {
      console.error('Error fetching received requests:', receivedError);
      return new Response(
        JSON.stringify({ error: receivedError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Combine sent and received requests
    const friendRequests = [...sentRequests, ...receivedRequests];
    
    return new Response(
      JSON.stringify({ friendRequests }),
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
