
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ActivityRequest {
  userId: string;
  feedType: 'friends' | 'global';
  limit?: number;
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

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the authenticated user - without throwing error if not authenticated
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error("Auth error:", userError.message);
    }
    
    const user = userData?.user;
    
    // Extract request parameters with defaults
    let userId = requestData?.userId || user?.id;
    const feedType = requestData?.feedType || 'global';
    const limit = requestData?.limit || 50;
    
    // Check if we have a valid userId (either from request or from auth)
    if (!userId && feedType === 'friends') {
      console.log("No user ID available for friends feed, defaulting to global");
      // For friends feed without authentication, default to global feed
      return new Response(
        JSON.stringify({ data: [] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let activitiesQuery = supabaseClient
      .from('activities')
      .select(`
        id,
        user_id,
        action_type,
        description,
        timestamp,
        profiles:user_id (username, full_name, display_name_preference, avatar_url),
        reactions:activity_reactions (
          id,
          reactor_id,
          reaction_type,
          message,
          timestamp,
          reactor:reactor_id (username, avatar_url)
        )
      `)
      .order('timestamp', { ascending: false })
      .limit(limit);

    // For friends feed, we need to filter by user's friends
    if (feedType === 'friends' && userId) {
      // Get the friends list
      const { data: friendsData, error: friendsError } = await supabaseClient
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId);
      
      if (friendsError) {
        console.error('Error fetching friends:', friendsError);
        // Don't fail the whole request, just log it and proceed with an empty friends list
      }

      // If there are friends, filter activities by friend IDs
      if (friendsData && friendsData.length > 0) {
        const friendIds = friendsData.map(f => f.friend_id);
        // Include current user in friends feed
        friendIds.push(userId);
        activitiesQuery = activitiesQuery.in('user_id', friendIds);
      } else {
        // If no friends, only show the current user's activities
        activitiesQuery = activitiesQuery.eq('user_id', userId);
      }
    }

    // Execute the query
    const { data: activities, error: activitiesError } = await activitiesQuery;

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return new Response(
        JSON.stringify({ error: 'Error fetching activities', details: activitiesError.message }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Process activities to get the correct display name and check if the current user has reacted
    const processedActivities = (activities || []).map(activity => {
      const profileData = activity.profiles;
      const username = profileData?.username || 'Anonymous';
      const fullName = profileData?.full_name || null;
      const displayNamePreference = profileData?.display_name_preference || 'username';
      
      // Determine display name based on preference
      let displayName = username;
      if (displayNamePreference === 'full_name' && fullName) {
        displayName = fullName;
      }

      // Check if current user has liked this activity
      const userReactions = (activity.reactions || []).filter(r => r.reactor_id === userId);
      const hasLiked = userReactions.some(r => r.reaction_type === 'like');
      const hasEncouraged = userReactions.some(r => r.reaction_type === 'encouragement');
      
      // Count reactions by type
      const likesCount = (activity.reactions || []).filter(r => r.reaction_type === 'like').length;
      const encouragementsCount = (activity.reactions || []).filter(r => r.reaction_type === 'encouragement').length;

      // Calculate time ago
      const timestamp = new Date(activity.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);
      
      let timeAgo;
      if (diffMins < 60) {
        timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else {
        timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }

      return {
        id: activity.id,
        userId: activity.user_id,
        actionType: activity.action_type,
        description: activity.description,
        timestamp: activity.timestamp,
        timeAgo,
        user: {
          displayName,
          username,
          fullName,
          avatarUrl: profileData?.avatar_url || '/placeholder.svg',
          isCurrentUser: activity.user_id === userId
        },
        reactions: {
          likes: likesCount,
          encouragements: encouragementsCount,
          hasLiked,
          hasEncouraged,
          details: (activity.reactions || []).map(r => ({
            id: r.id,
            type: r.reaction_type,
            message: r.message,
            reactorId: r.reactor_id,
            reactorName: r.reactor?.username || 'Anonymous',
            reactorAvatar: r.reactor?.avatar_url || '/placeholder.svg',
            timestamp: r.timestamp
          }))
        }
      };
    });

    // Return the activities
    return new Response(
      JSON.stringify({ data: processedActivities }), 
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
