import { supabase } from "@/integrations/supabase/client";

// Types for leaderboard data
export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  focusHours: number;
  streak: number;
  isCurrentUser: boolean;
  badge?: string;
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
        name: "You", 
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
    
    // Get friends list - avoiding the user_connections table query if it's not available yet
    let friendIds: string[] = [];
    try {
      // Make a direct RPC call to get friend IDs
      const { data: followingData, error: followingError } = await supabase.rpc<UserFollow[]>('get_user_follows', {
        user_id_param: user.id
      });
      
      if (!followingError && followingData) {
        friendIds = followingData.map(connection => connection.following_id);
      }
    } catch (error) {
      console.error('Error fetching friend IDs:', error);
      // Continue with empty friend list if there's an error
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
        profiles:user_id(username, avatar_url)
      `)
      .in('user_id', friendIds)
      .order('points', { ascending: false });
      
    if (friendsStatsError) {
      console.error('Error fetching friends stats:', friendsStatsError);
      return [];
    }
    
    // Format data for the leaderboard
    let result = friendsStats.map((stat, index) => {
      const profileData = stat.profiles as any;
      const username = profileData?.username || 'Unknown';
      const avatarUrl = profileData?.avatar_url || '/placeholder.svg';
      const isCurrentUser = stat.user_id === user.id;
      
      // Get appropriate badge based on ranking
      let badge;
      if (index === 0) badge = "Champion";
      else if (index === 1) badge = "Expert";
      else if (index === 2) badge = "Consistent";
      else if (isCurrentUser) badge = "Climber";
      
      return {
        rank: index + 1,
        name: isCurrentUser ? "You" : username,
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
      result.push({
        rank: result.length + 1,
        name: "You",
        avatar: "/placeholder.svg",
        points: currentUserStats.points || 0,
        focusHours: (currentUserStats.weekly_focus_time || 0) / 60,
        streak: currentUserStats.current_streak || 0,
        isCurrentUser: true,
        badge: "New"
      });
    }
    
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
        name: "You", 
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
    
    // Get current user's rank by querying all leaderboard stats ordered by points
    const { data: allStats, error: allStatsError } = await supabase
      .from('leaderboard_stats')
      .select(`
        points, 
        weekly_focus_time, 
        current_streak, 
        user_id,
        profiles:user_id(username, avatar_url)
      `)
      .order('points', { ascending: false });
      
    if (allStatsError) {
      console.error('Error fetching all stats:', allStatsError);
      return [];
    }
    
    // Find current user's position in the global ranking
    const userRank = allStats.findIndex(stat => stat.user_id === user.id);
    
    // If user is not ranked, return empty array
    if (userRank === -1) {
      return [];
    }
    
    // Get top 3 users plus the current user and a few around them
    const relevantUsers = [];
    
    // Add top 3 users
    for (let i = 0; i < 3 && i < allStats.length; i++) {
      relevantUsers.push(allStats[i]);
    }
    
    // Add users around the current user (if not already in top 3)
    if (userRank >= 3) {
      // Add one user above current user
      if (userRank > 3) {
        relevantUsers.push(allStats[userRank - 1]);
      }
      
      // Add current user
      relevantUsers.push(allStats[userRank]);
      
      // Add one user below current user
      if (userRank + 1 < allStats.length) {
        relevantUsers.push(allStats[userRank + 1]);
      }
    }
    
    // Format data for the leaderboard
    return relevantUsers.map(stat => {
      const rank = allStats.findIndex(s => s.user_id === stat.user_id) + 1;
      const profileData = stat.profiles as any;
      const username = profileData?.username || 'Unknown';
      const avatarUrl = profileData?.avatar_url || '/placeholder.svg';
      const isCurrentUser = stat.user_id === user.id;
      
      // Get appropriate badge based on ranking
      let badge;
      if (rank === 1) badge = "Legend";
      else if (rank === 2) badge = "Master";
      else if (rank === 3) badge = "Expert";
      else if (isCurrentUser) badge = "Climber";
      
      return {
        rank,
        name: isCurrentUser ? "You" : username,
        avatar: avatarUrl,
        points: stat.points || 0,
        focusHours: (stat.weekly_focus_time || 0) / 60, // Convert minutes to hours
        streak: stat.current_streak || 0,
        isCurrentUser,
        badge
      };
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
