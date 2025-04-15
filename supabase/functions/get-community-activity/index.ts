
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
    let requestData: ActivityRequest | null = null;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      // Return 200 status with error information instead of 400
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', data: [] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Default values if request data is missing
    const userId = requestData?.userId || null;
    const feedType = requestData?.feedType || 'global';
    const limit = requestData?.limit || 50;
    
    // Get the authenticated user if available
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError) {
      console.error("Auth error:", userError.message);
      // Continue with null user instead of failing
    }
    
    const authenticatedUserId = userData?.user?.id;
    
    // Use authenticated user ID if no userId provided in request
    const effectiveUserId = userId || authenticatedUserId;

    // If no user is authenticated and no userId provided, return empty array
    if (!effectiveUserId) {
      return new Response(
        JSON.stringify({ data: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Initialize query to get activities
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

    try {
      // For friends feed, we need to filter by user's friends
      if (feedType === 'friends' && effectiveUserId) {
        try {
          // Get the friends list
          const { data: friendsData, error: friendsError } = await supabaseClient
            .from('friends')
            .select('friend_id')
            .eq('user_id', effectiveUserId);
          
          if (friendsError) {
            console.error('Error fetching friends:', friendsError);
            // Continue with empty friends list instead of failing
          }

          // If there are friends, filter activities by friend IDs
          if (friendsData && friendsData.length > 0) {
            const friendIds = friendsData.map(f => f.friend_id);
            // Include current user in friends feed
            friendIds.push(effectiveUserId);
            activitiesQuery = activitiesQuery.in('user_id', friendIds);
          } else {
            // If no friends, only show the current user's activities
            activitiesQuery = activitiesQuery.eq('user_id', effectiveUserId);
          }
        } catch (friendsQueryError) {
          console.error('Error querying friends:', friendsQueryError);
          // Default to filtering by only the user's activities
          activitiesQuery = activitiesQuery.eq('user_id', effectiveUserId);
        }
      }
    } catch (error) {
      console.error('Error setting up query filters:', error);
      // Return an empty array with a 200 status code instead of failing
      return new Response(
        JSON.stringify({ 
          error: 'Error setting up query filters', 
          details: error instanceof Error ? error.message : String(error),
          data: [] 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Execute the query with error handling
    try {
      const { data: activities, error: activitiesError } = await activitiesQuery;

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        // Return an empty array with error details but with 200 status
        return new Response(
          JSON.stringify({ 
            error: 'Error fetching activities', 
            details: activitiesError.message,
            data: [] 
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
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
        const userReactions = (activity.reactions || []).filter(r => r.reactor_id === effectiveUserId);
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
          timeAgo = `${diffMins === 0 ? 'just now' : `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`}`;
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
            isCurrentUser: activity.user_id === effectiveUserId
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

      // Return the activities with a 200 status code
      return new Response(
        JSON.stringify({ data: processedActivities }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (queryError) {
      console.error('Error executing activities query:', queryError);
      // Return an empty array with error details but with 200 status
      return new Response(
        JSON.stringify({ 
          error: 'Error executing activities query', 
          details: queryError instanceof Error ? queryError.message : String(queryError),
          data: [] 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    // Even for unexpected errors, return 200 with error information
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error', 
        details: error instanceof Error ? error.message : String(error),
        data: []
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
