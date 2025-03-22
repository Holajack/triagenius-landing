
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the auth admin role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the user is authenticated before proceeding
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if we have a valid user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all users from the auth.users table using the admin API
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Error fetching users:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get profiles to fetch display preferences
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, display_name_preference')
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      // Continue without profiles data
    }

    const profileMap = new Map();
    if (profiles) {
      profiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }

    // Filter and format the user data to include only necessary information
    const filteredUsers = users.map(user => {
      const profile = profileMap.get(user.id);
      const displayNamePreference = profile?.display_name_preference || 'username';
      const profileFullName = profile?.full_name;
      const metadataFullName = user.user_metadata?.full_name;
      
      return {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
        created_at: user.created_at,
        full_name: profileFullName || metadataFullName || null,
        display_name_preference: displayNamePreference,
        last_sign_in_at: user.last_sign_in_at
      };
    });

    console.log(`Successfully fetched ${filteredUsers.length} users`)
    
    // Return the filtered user data
    return new Response(
      JSON.stringify({ users: filteredUsers }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
