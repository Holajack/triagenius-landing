
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
    const { senderId, recipientId } = await req.json();
    
    if (!senderId || !recipientId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Check if friend request already exists
    const { data: existingRequests, error: checkError } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`);
      
    if (checkError) {
      console.error('Error checking for existing requests:', checkError);
      return new Response(
        JSON.stringify({ error: checkError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (existingRequests && existingRequests.length > 0) {
      return new Response(
        JSON.stringify({ error: "Friend request already exists", friendRequest: existingRequests[0] }),
        { status: 409, headers: corsHeaders }
      );
    }
    
    // Create new friend request
    const { data: friendRequest, error: insertError } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        status: 'pending'
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Error creating friend request:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    return new Response(
      JSON.stringify({ friendRequest }),
      { status: 201, headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
