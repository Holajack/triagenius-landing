
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
    const { requestId, status } = await req.json();
    
    if (!requestId || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate status
    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status value" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Update friend request
    const { data: friendRequest, error: updateError } = await supabase
      .from('friend_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating friend request:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Create user connection if accepted
    if (status === 'accepted') {
      try {
        // Check if user_connections table exists
        const { data: tablesExist } = await supabase
          .from('user_connections')
          .select('id')
          .limit(1);
          
        // If table exists, create connections
        if (tablesExist !== null) {
          // Create two-way connection between users
          await supabase
            .from('user_connections')
            .insert([
              {
                follower_id: friendRequest.sender_id,
                following_id: friendRequest.recipient_id
              },
              {
                follower_id: friendRequest.recipient_id,
                following_id: friendRequest.sender_id
              }
            ]);
        }
      } catch (error) {
        console.error('Error creating user connections:', error);
        // Don't return error - we still want to accept the friend request even if connection fails
      }
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
