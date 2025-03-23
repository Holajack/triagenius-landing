
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
    const { user_id, other_user_id } = await req.json();
    
    if (!user_id || !other_user_id) {
      return new Response(
        JSON.stringify({ error: "Both user IDs are required" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Determine participant order (lower UUID first)
    let participant_one = user_id;
    let participant_two = other_user_id;
    
    // Swap if needed to ensure consistent ordering
    if (participant_one > participant_two) {
      [participant_one, participant_two] = [participant_two, participant_one];
    }
    
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
      return new Response(
        JSON.stringify({ 
          conversation_id: existingConversation.id,
          is_new: false 
        }),
        { status: 200, headers: corsHeaders }
      );
    }
    
    // Create a new conversation
    const { data: newConversation, error: insertError } = await supabase
      .from('conversations')
      .insert({
        participant_one,
        participant_two
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
    
    // Make sure the new conversation is included in the realtime publication
    try {
      await supabase.functions.invoke('enable_realtime_for_table', {
        body: { table_name: 'conversations' }
      });
    } catch (err) {
      console.error('Failed to enable realtime for conversations:', err);
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
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
