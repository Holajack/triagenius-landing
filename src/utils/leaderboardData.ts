
// First part of the file with imports and existing type definitions
import { supabase } from "@/integrations/supabase/client";
import { getDisplayName } from "@/hooks/use-display-name";

// Types for leaderboard data
export interface LeaderboardUser {
  rank: number;
  id: string | number;
  name: string;
  username: string | null;
  full_name: string | null;
  display_name_preference: 'username' | 'full_name' | null;
  avatar: string;
  points: number;
  focusHours: number;
  streak: number;
  badge?: string;
  isCurrentUser?: boolean;
  isSeparator?: boolean;
}

// Type for the RPC response
interface UserFollow {
  following_id: string;
}

// Fetch friends leaderboard data from Supabase
export const getFriendsLeaderboardData = async (isEmpty = false): Promise<LeaderboardUser[]> => {
  if (isEmpty) {
    return [
      { 
        rank: 1, 
        id: "1", 
        name: "You", 
        username: "You",
        full_name: null,
        display_name_preference: null,
        avatar: "/placeholder.svg", 
        points: 0, 
        focusHours: 0, 
        streak: 0,
        isCurrentUser: true, 
        badge: "New" 
      }
    ];
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    // Get current user's leaderboard stats
    const { data: currentUserStats, error: currentUserError } = await supabase
      .from('leaderboard_stats')
      .select('points, weekly_focus_time, current_streak')
      .eq('user_id', user.id)
      .single();
      
    if (currentUserError) {
      console.error('Error fetching current user stats:', currentUserError);
      return [];
    }
    
    // Get friends list from the friends table
    let friendIds: string[] = [];
    try {
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id);
        
      if (!friendsError && friendsData && friendsData.length > 0) {
        console.log('Found friends in friends table:', friendsData.length);
        friendIds = friendsData.map(f => f.friend_id);
      } else {
        console.log('No friends found in friends table, trying follows');
        // Fall back to follows if not found in friends table
        const { data: followingData, error: followingError } = await supabase.rpc(
          'get_user_follows',
          { user_id_param: user.id }
        );
        
        if (!followingError && followingData) {
          const typedFollowingData = followingData as UserFollow[];
          console.log('Found follows:', typedFollowingData.length);
          friendIds = typedFollowingData.map(connection => connection.following_id);
        }
      }
    } catch (error) {
      console.error('Error fetching friend IDs:', error);
      // Continue with empty friend list if there's an error
    }
    
    // Log the number of friend IDs found
    console.log('Total friend IDs found:', friendIds.length);
    
    // If no friends found, just return the current user
    if (friendIds.length === 0) {
      console.log('No friends found, returning only current user');
      
      // Get current user profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('username, full_name, display_name_preference, avatar_url')
        .eq('id', user.id)
        .single();
      
      return [{
        rank: 1,
        id: user.id,
        name: "You",
        username: userProfile?.username || user.email?.split('@')[0] || null,
        full_name: userProfile?.full_name || null,
        display_name_preference: userProfile?.display_name_preference as 'username' | 'full_name' | null,
        avatar: userProfile?.avatar_url || "/placeholder.svg",
        points: currentUserStats?.points || 0,
        focusHours: (currentUserStats?.weekly_focus_time || 0) / 60,
        streak: currentUserStats?.current_streak || 0,
        isCurrentUser: true,
        badge: "Solo"
      }];
    }
    
    // Include current user's ID
    friendIds.push(user.id);
    
    // Get leaderboard stats for friends and current user
    const { data: friendsStats, error: friendsStatsError } = await supabase
      .from('leaderboard_stats')
      .select(`
        points, 
        weekly_focus_time, 
        current_streak, 
        user_id,
        profiles:user_id(username, full_name, display_name_preference, avatar_url)
      `)
      .in('user_id', friendIds)
      .order('points', { ascending: false });
      
    if (friendsStatsError) {
      console.error('Error fetching friends stats:', friendsStatsError);
      return [];
    }
    
    console.log('Friends stats fetched:', friendsStats?.length || 0);
    
    // Format data for the leaderboard
    let result = (friendsStats || []).map((stat, index) => {
      const profileData = stat.profiles as any;
      const username = profileData?.username || 'Unknown';
      const full_name = profileData?.full_name || null;
      const display_name_preference = profileData?.display_name_preference as 'username' | 'full_name' | null;
      const avatarUrl = profileData?.avatar_url || '/placeholder.svg';
      const isCurrentUser = stat.user_id === user.id;
      
      // Get display name based on preference
      const displayName = isCurrentUser 
        ? "You"
        : getDisplayName({
            username,
            full_name: full_name || '',
            display_name_preference
          });
      
      // Get appropriate badge based on ranking
      let badge;
      if (index === 0) badge = "Champion";
      else if (index === 1) badge = "Expert";
      else if (index === 2) badge = "Consistent";
      else if (isCurrentUser) badge = "Climber";
      
      return {
        rank: index + 1,
        id: stat.user_id, // Using user_id as the id
        name: displayName,
        username,
        full_name,
        display_name_preference,
        avatar: avatarUrl,
        points: stat.points || 0,
        focusHours: (stat.weekly_focus_time || 0) / 60, // Convert minutes to hours
        streak: stat.current_streak || 0,
        isCurrentUser,
        badge
      };
    });
    
    // If somehow the current user is not in the list, add them
    if (!result.some(user => user.isCurrentUser)) {
      console.log('Adding current user to results');
      // Get current user profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('username, full_name, display_name_preference, avatar_url')
        .eq('id', user.id)
        .single();
      
      result.push({
        rank: result.length + 1,
        id: user.id, // Using user.id as the id
        name: "You",
        username: userProfile?.username || user.email?.split('@')[0] || null,
        full_name: userProfile?.full_name || null,
        display_name_preference: userProfile?.display_name_preference as 'username' | 'full_name' | null,
        avatar: userProfile?.avatar_url || "/placeholder.svg",
        points: currentUserStats.points || 0,
        focusHours: (currentUserStats.weekly_focus_time || 0) / 60,
        streak: currentUserStats.current_streak || 0,
        isCurrentUser: true,
        badge: "You"
      });
    }
    
    console.log('Returning friend leaderboard data:', result.length);
    return result;
  } catch (error) {
    console.error('Error in getFriendsLeaderboardData:', error);
    return [];
  }
};

// Fetch global leaderboard data from Supabase
export const getGlobalLeaderboardData = async (isEmpty = false): Promise<LeaderboardUser[]> => {
  if (isEmpty) {
    return [
      { 
        rank: 1, 
        id: "1", 
        name: "You",
        username: "You",
        full_name: null,
        display_name_preference: null,
        avatar: "/placeholder.svg", 
        points: 0, 
        focusHours: 0, 
        streak: 0,
        isCurrentUser: true, 
        badge: "New" 
      }
    ];
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    // Get ALL leaderboard stats ordered by points - don't filter by anything
    const { data: allStats, error: statsError } = await supabase
      .from('leaderboard_stats')
      .select(`
        id,
        points, 
        weekly_focus_time, 
        current_streak, 
        user_id,
        profiles:user_id(username, full_name, display_name_preference, avatar_url)
      `)
      .order('points', { ascending: false })
      .order('current_streak', { ascending: false })
      .order('weekly_focus_time', { ascending: false })
      .limit(100); // Add a reasonable limit
      
    if (statsError || !allStats) {
      console.error('Error fetching global leaderboard stats:', statsError);
      return [];
    }
    
    // Find current user's position
    const userRank = allStats.findIndex(stat => stat.user_id === user.id) + 1 || 0;
    
    // Get relevant stats to display
    const displayStats = [];
    
    // Always include top 10 users
    const topUsers = allStats.slice(0, Math.min(10, allStats.length));
    displayStats.push(...topUsers);
    
    // If current user is not in top 10, include them and a few nearby users
    if (userRank > 10 && userRank <= allStats.length) {
      // Add separator
      displayStats.push({ 
        isSeparator: true,
        rank: -1,
        id: "separator",
        name: "...",
        username: null,
        full_name: null,
        display_name_preference: null,
        avatar: "",
        points: 0,
        focusHours: 0,
        streak: 0
      });
      
      // Add user above current user (if there is one)
      if (userRank > 1) {
        displayStats.push(allStats[userRank - 2]);
      }
      
      // Add current user
      displayStats.push(allStats[userRank - 1]);
      
      // Add user below current user (if there is one)
      if (userRank < allStats.length) {
        displayStats.push(allStats[userRank]);
      }
    }
    
    // Format data for the leaderboard
    return displayStats.map((stat) => {
      // Handle separator
      if (stat.isSeparator) {
        return {
          isSeparator: true,
          rank: -1,
          id: "separator",
          name: "...",
          username: null,
          full_name: null,
          display_name_preference: null,
          avatar: "",
          points: 0,
          focusHours: 0,
          streak: 0
        } as LeaderboardUser;
      }
      
      const realRank = allStats.findIndex(s => s.id === stat.id) + 1;
      const profileData = stat.profiles as any;
      const username = profileData?.username || 'Anonymous';
      const full_name = profileData?.full_name || null;
      const display_name_preference = profileData?.display_name_preference as 'username' | 'full_name' | null;
      const avatarUrl = profileData?.avatar_url || '/placeholder.svg';
      const isCurrentUser = stat.user_id === user.id;
      
      // Get display name based on preference
      const displayName = isCurrentUser 
        ? "You"
        : getDisplayName({
            username,
            full_name: full_name || '',
            display_name_preference
          });
      
      // Get appropriate badge based on ranking
      let badge;
      if (realRank === 1) badge = "Champion";
      else if (realRank === 2) badge = "Expert";
      else if (realRank === 3) badge = "Dedicated";
      else if (isCurrentUser) badge = "You";
      else if (realRank <= 10) badge = "Top 10";
      
      return {
        rank: realRank,
        id: stat.id || stat.user_id,
        name: displayName,
        username,
        full_name,
        display_name_preference,
        avatar: avatarUrl,
        points: stat.points || 0,
        focusHours: (stat.weekly_focus_time || 0) / 60, // Convert minutes to hours
        streak: stat.current_streak || 0,
        isCurrentUser,
        badge
      } as LeaderboardUser;
    });
  } catch (error) {
    console.error('Error in getGlobalLeaderboardData:', error);
    return [];
  }
};

// Get user's ranking message
export const getUserRankingMessage = async (type: "friends" | "global", isEmpty = false): Promise<string> => {
  if (isEmpty) {
    if (type === "friends") {
      return "Add friends to compare your progress!";
    } else {
      return "Complete focus sessions to appear on the global leaderboard!";
    }
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "Sign in to see your ranking";
    
    if (type === "friends") {
      // Get friends leaderboard data
      const friendsData = await getFriendsLeaderboardData();
      
      // Find current user's position
      const userPosition = friendsData.findIndex(data => data.isCurrentUser) + 1;
      
      if (userPosition <= 0) {
        return "Add friends to compare your progress!";
      }
      
      // Get appropriate ordinal suffix
      const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };
      
      return `You're in ${getOrdinal(userPosition)} place among friends this week!`;
    } else {
      // Get total user count
      const { count, error } = await supabase
        .from('leaderboard_stats')
        .select('*', { count: 'exact', head: true });
        
      if (error || !count) {
        return "Complete focus sessions to appear on the global leaderboard!";
      }
      
      // Get current user's rank
      const { data: allUsers } = await supabase
        .from('leaderboard_stats')
        .select('user_id, points')
        .order('points', { ascending: false });
        
      const userRank = allUsers?.findIndex(u => u.user_id === user.id) + 1 || 0;
      
      if (userRank <= 0) {
        return "Complete focus sessions to appear on the global leaderboard!";
      }
      
      // Calculate percentage (top X%)
      const percentage = Math.round((userRank / count) * 100);
      
      return `You're in the top ${percentage}% of all users this week!`;
    }
  } catch (error) {
    console.error('Error getting user ranking message:', error);
    return "Error loading your ranking";
  }
};

// Get community activity feed from real user actions
export const getCommunityActivityFeed = async (isNewUser = false): Promise<any[]> => {
  if (isNewUser) return [];
  
  try {
    // Get recent focus sessions and reflections
    const { data: sessions, error: sessionsError } = await supabase
      .from('focus_sessions')
      .select(`
        id,
        user_id,
        duration,
        created_at,
        profiles:user_id(username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (sessionsError) {
      console.error('Error fetching activity data:', sessionsError);
      return [];
    }
    
    // Format the data for the activity feed
    return sessions.map(session => {
      const profileData = session.profiles as any;
      const username = profileData?.username || 'Unknown User';
      const avatar = profileData?.avatar_url || '/placeholder.svg';
      const duration = session.duration || 0;
      const durationHours = Math.round(duration / 60 * 10) / 10; // Convert minutes to hours with 1 decimal
      
      // Calculate time ago
      const timestamp = new Date(session.created_at);
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);
      
      let timeAgo;
      if (diffMins < 60) {
        timeAgo = `${diffMins} minutes ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hours ago`;
      } else {
        timeAgo = `${diffDays} days ago`;
      }
      
      return {
        id: session.id,
        user: username,
        avatar: avatar,
        action: `completed a ${durationHours}-hour focus session`,
        time: timeAgo,
        likes: Math.floor(Math.random() * 10),
        comments: Math.floor(Math.random() * 5),
        isLiked: Math.random() > 0.7
      };
    });
  } catch (error) {
    console.error('Error in getCommunityActivityFeed:', error);
    return [];
  }
};
