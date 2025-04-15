
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
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const { user_id, other_user_id } = await req.json();
    
    // Validate required parameters
    if (!user_id || !other_user_id) {
      console.error('Missing required parameters', { user_id, other_user_id });
      return new Response(
        JSON.stringify({ error: "Both user IDs are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate that both users exist in the database
    const { data: usersExist, error: userCheckError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', [user_id, other_user_id]);
      
    if (userCheckError) {
      console.error('Error checking if users exist:', userCheckError);
      return new Response(
        JSON.stringify({ error: "Failed to validate user IDs" }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!usersExist || usersExist.length < 2) {
      console.error('One or both users do not exist', { usersFound: usersExist?.length || 0 });
      return new Response(
        JSON.stringify({ error: "One or both users do not exist" }),
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Determine participant order (lower UUID first)
    let participant_one = user_id;
    let participant_two = other_user_id;
    
    // Swap if needed to ensure consistent ordering
    if (participant_one > participant_two) {
      [participant_one, participant_two] = [participant_two, participant_one];
    }
    
    console.log(`Looking up conversation between ${participant_one} and ${participant_two}`);
    
    // Check if a conversation already exists
    const { data: existingConversation, error: lookupError } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_one', participant_one)
      .eq('participant_two', participant_two)
      .maybeSingle();
    
    if (lookupError) {
      console.error('Error looking up conversation:', lookupError);
      return new Response(
        JSON.stringify({ error: lookupError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // If conversation exists, return it
    if (existingConversation) {
      console.log(`Found existing conversation: ${existingConversation.id}`);
      return new Response(
        JSON.stringify({ 
          conversation_id: existingConversation.id,
          is_new: false 
        }),
        { status: 200, headers: corsHeaders }
      );
    }
    
    console.log('No existing conversation found, creating new one');
    
    // Create a new conversation
    const { data: newConversation, error: insertError } = await supabase
      .from('conversations')
      .insert({
        participant_one,
        participant_two,
        updated_at: new Date().toISOString() // Ensure the updated_at is set
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Error creating conversation:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!newConversation) {
      console.error('Failed to create conversation, no data returned');
      return new Response(
        JSON.stringify({ error: "Failed to create conversation" }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log(`Created new conversation: ${newConversation.id}`);
    
    // Enable realtime for the conversations table
    try {
      // Execute the raw SQL query to enable realtime for the conversations table
      const { error: realtimeError } = await supabase.rpc(
        'enable_realtime_for_table',
        { table_name: 'conversations' }
      );
      
      if (realtimeError) {
        // Log but don't fail the request
        console.error('Failed to enable realtime for conversations:', realtimeError);
      }
    } catch (err) {
      console.error('Failed to enable realtime for conversations:', err);
      // Continue anyway, not critical
    }
    
    // Also enable realtime for the messages table
    try {
      const { error: messagesRealtimeError } = await supabase.rpc(
        'enable_realtime_for_table',
        { table_name: 'messages' }
      );
      
      if (messagesRealtimeError) {
        // Log but don't fail the request
        console.error('Failed to enable realtime for messages:', messagesRealtimeError);
      }
    } catch (err) {
      console.error('Failed to enable realtime for messages:', err);
      // Continue anyway, not critical
    }
    
    return new Response(
      JSON.stringify({ 
        conversation_id: newConversation.id,
        is_new: true 
      }),
      { status: 201, headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
