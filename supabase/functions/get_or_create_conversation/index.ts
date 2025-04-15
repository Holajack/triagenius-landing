
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
    
    // Parse request body with extra validation
    let requestData;
    try {
      requestData = await req.json();
    } catch (jsonError) {
      console.error('Failed to parse request JSON:', jsonError);
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { user_id, other_user_id } = requestData;
    
    // Validate required parameters with more detailed errors
    if (!user_id) {
      console.error('Missing user_id parameter');
      return new Response(
        JSON.stringify({ error: "Missing user_id parameter" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!other_user_id) {
      console.error('Missing other_user_id parameter');
      return new Response(
        JSON.stringify({ error: "Missing other_user_id parameter" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Prevent conversations with self
    if (user_id === other_user_id) {
      console.error('Cannot create conversation with self', { user_id });
      return new Response(
        JSON.stringify({ error: "Cannot create conversation with yourself" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate that both users exist in the database with improved error handling
    try {
      const { data: usersExist, error: userCheckError } = await supabase
        .from('profiles')
        .select('id')
        .in('id', [user_id, other_user_id]);
        
      if (userCheckError) {
        console.error('Error checking if users exist:', userCheckError);
        return new Response(
          JSON.stringify({ error: "Failed to validate user IDs", details: userCheckError.message }),
          { status: 500, headers: corsHeaders }
        );
      }
      
      if (!usersExist || usersExist.length < 2) {
        console.error('One or both users do not exist', { 
          usersFound: usersExist?.length || 0,
          foundIds: usersExist?.map(u => u.id).join(', ')
        });
        
        // More detailed error message about which user(s) couldn't be found
        const missingUsers = [];
        const foundIds = usersExist?.map(u => u.id) || [];
        if (!foundIds.includes(user_id)) missingUsers.push('user_id');
        if (!foundIds.includes(other_user_id)) missingUsers.push('other_user_id');
        
        return new Response(
          JSON.stringify({ error: `One or both users do not exist`, missing: missingUsers }),
          { status: 404, headers: corsHeaders }
        );
      }
    } catch (userCheckException) {
      console.error('Unexpected error validating users:', userCheckException);
      return new Response(
        JSON.stringify({ error: "Failed to validate users due to an internal error" }),
        { status: 500, headers: corsHeaders }
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
    
    // Check if a conversation already exists with retry logic
    let existingConversation = null;
    let lookupError = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries && !existingConversation && !lookupError) {
      try {
        const result = await supabase
          .from('conversations')
          .select('id')
          .eq('participant_one', participant_one)
          .eq('participant_two', participant_two)
          .maybeSingle();
          
        existingConversation = result.data;
        lookupError = result.error;
        
        if (lookupError) {
          console.error(`Lookup attempt ${retryCount + 1} failed:`, lookupError);
          retryCount++;
          // Simple exponential backoff
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retryCount)));
          }
        } else {
          break; // Success, exit retry loop
        }
      } catch (unexpectedError) {
        console.error(`Unexpected error in lookup attempt ${retryCount + 1}:`, unexpectedError);
        lookupError = unexpectedError;
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retryCount)));
        }
      }
    }
    
    if (lookupError) {
      console.error('Error looking up conversation after retries:', lookupError);
      return new Response(
        JSON.stringify({ error: "Failed to lookup conversation", details: lookupError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // If conversation exists, return it
    if (existingConversation) {
      console.log(`Found existing conversation: ${existingConversation.id}`);
      return new Response(
        JSON.stringify({ 
          conversation_id: existingConversation.id,
          is_new: false,
          participant_one,
          participant_two
        }),
        { status: 200, headers: corsHeaders }
      );
    }
    
    console.log('No existing conversation found, creating new one');
    
    // Create a new conversation with retry logic
    let newConversation = null;
    let insertError = null;
    retryCount = 0;
    
    while (retryCount < maxRetries && !newConversation && !insertError) {
      try {
        const result = await supabase
          .from('conversations')
          .insert({
            participant_one,
            participant_two,
            updated_at: new Date().toISOString() // Ensure the updated_at is set
          })
          .select('id')
          .single();
        
        newConversation = result.data;
        insertError = result.error;
        
        if (insertError) {
          console.error(`Insert attempt ${retryCount + 1} failed:`, insertError);
          
          // Check if error is due to race condition (conversation already exists)
          if (insertError.code === '23505') { // Unique violation
            console.log('Race condition detected, trying to fetch the conversation again');
            const { data, error } = await supabase
              .from('conversations')
              .select('id')
              .eq('participant_one', participant_one)
              .eq('participant_two', participant_two)
              .single();
              
            if (!error && data) {
              newConversation = data;
              insertError = null;
              break;
            }
          }
          
          retryCount++;
          // Simple exponential backoff
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retryCount)));
          }
        } else {
          break; // Success, exit retry loop
        }
      } catch (unexpectedError) {
        console.error(`Unexpected error in insert attempt ${retryCount + 1}:`, unexpectedError);
        insertError = unexpectedError;
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retryCount)));
        }
      }
    }
    
    if (insertError) {
      console.error('Error creating conversation after retries:', insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create conversation", details: insertError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!newConversation) {
      console.error('Failed to create conversation, no data returned');
      return new Response(
        JSON.stringify({ error: "Failed to create conversation, no data returned" }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log(`Created new conversation: ${newConversation.id}`);
    
    // Enable realtime for the conversations table - but don't fail if this doesn't work
    try {
      const { error: realtimeError } = await supabase.rpc(
        'enable_realtime_for_table',
        { table_name: 'conversations' }
      );
      
      if (realtimeError) {
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
        console.error('Failed to enable realtime for messages:', messagesRealtimeError);
      }
    } catch (err) {
      console.error('Failed to enable realtime for messages:', err);
      // Continue anyway, not critical
    }
    
    return new Response(
      JSON.stringify({ 
        conversation_id: newConversation.id,
        is_new: true,
        participant_one,
        participant_two
      }),
      { status: 201, headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    let errorMessage = "Internal server error";
    let errorDetails = String(error);
    
    // Try to extract a more useful error message if possible
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage, details: errorDetails }),
      { status: 500, headers: corsHeaders }
    );
  }
});
