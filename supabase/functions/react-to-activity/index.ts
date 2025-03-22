import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReactionRequest {
  activityId: string;
  reactionType: 'like' | 'encouragement';
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message || 'User not found' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse request body
    const { activityId, reactionType, message } = await req.json() as ReactionRequest;
    
    if (!activityId || !reactionType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', details: 'activityId and reactionType are required' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if the activity exists
    const { data: activity, error: activityError } = await supabaseClient
      .from('activities')
      .select('id, user_id')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      console.error('Error finding activity:', activityError);
      return new Response(
        JSON.stringify({ error: 'Activity not found', details: activityError?.message || 'Activity does not exist' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check if user is trying to react to their own activity
    if (activity.user_id === user.id && reactionType === 'like') {
      return new Response(
        JSON.stringify({ error: 'Invalid operation', details: 'Users cannot like their own activities' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if user already reacted with this type
    const { data: existingReaction, error: reactionCheckError } = await supabaseClient
      .from('activity_reactions')
      .select('id')
      .eq('activity_id', activityId)
      .eq('reactor_id', user.id)
      .eq('reaction_type', reactionType)
      .maybeSingle();

    if (reactionCheckError) {
      console.error('Error checking existing reaction:', reactionCheckError);
      return new Response(
        JSON.stringify({ error: 'Error checking reaction', details: reactionCheckError.message }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let result;
    
    // If reaction exists, remove it (toggle behavior)
    if (existingReaction) {
      const { error: deleteError } = await supabaseClient
        .from('activity_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) {
        console.error('Error removing reaction:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Error removing reaction', details: deleteError.message }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      result = { success: true, action: 'removed', reactionType };
    } 
    // Otherwise, create a new reaction
    else {
      const reactionData = {
        activity_id: activityId,
        reactor_id: user.id,
        reaction_type: reactionType,
        message: reactionType === 'encouragement' ? message : null,
        timestamp: new Date().toISOString()
      };

      const { data: newReaction, error: insertError } = await supabaseClient
        .from('activity_reactions')
        .insert(reactionData)
        .select('id')
        .single();

      if (insertError) {
        console.error('Error adding reaction:', insertError);
        return new Response(
          JSON.stringify({ error: 'Error adding reaction', details: insertError.message }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      result = { success: true, action: 'added', reactionType, data: newReaction };
    }

    return new Response(
      JSON.stringify(result), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: error.message }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
