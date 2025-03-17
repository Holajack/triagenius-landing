
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

// Friends leaderboard data
export const getFriendsLeaderboardData = (isEmpty = false): LeaderboardUser[] => {
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
  
  return [
    { 
      rank: 1, 
      name: "Sarah Johnson", 
      avatar: "/placeholder.svg", 
      points: 1250, 
      focusHours: 42.5, 
      streak: 14,
      isCurrentUser: false, 
      badge: "Champion" 
    },
    { 
      rank: 2, 
      name: "Michael Chen", 
      avatar: "/placeholder.svg", 
      points: 1180, 
      focusHours: 38.1, 
      streak: 9,
      isCurrentUser: false, 
      badge: "Expert" 
    },
    { 
      rank: 3, 
      name: "You", 
      avatar: "/placeholder.svg", 
      points: 1050, 
      focusHours: 32.8, 
      streak: 7,
      isCurrentUser: true, 
      badge: "Consistent" 
    },
    { 
      rank: 4, 
      name: "David Miller", 
      avatar: "/placeholder.svg", 
      points: 980, 
      focusHours: 29.4, 
      streak: 5,
      isCurrentUser: false 
    },
    { 
      rank: 5, 
      name: "Emily Wilson", 
      avatar: "/placeholder.svg", 
      points: 870, 
      focusHours: 24.7, 
      streak: 3,
      isCurrentUser: false 
    }
  ];
};

// Global leaderboard data
export const getGlobalLeaderboardData = (isEmpty = false): LeaderboardUser[] => {
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
  
  return [
    { 
      rank: 1, 
      name: "Thomas Anderson", 
      avatar: "/placeholder.svg", 
      points: 3240, 
      focusHours: 78.2, 
      streak: 41,
      isCurrentUser: false, 
      badge: "Legend" 
    },
    { 
      rank: 2, 
      name: "Kate Williams", 
      avatar: "/placeholder.svg", 
      points: 2980, 
      focusHours: 71.3, 
      streak: 32,
      isCurrentUser: false, 
      badge: "Master" 
    },
    { 
      rank: 3, 
      name: "Alex Thompson", 
      avatar: "/placeholder.svg", 
      points: 2725, 
      focusHours: 65.7, 
      streak: 27,
      isCurrentUser: false, 
      badge: "Expert" 
    },
    { 
      rank: 28, 
      name: "You", 
      avatar: "/placeholder.svg", 
      points: 1050, 
      focusHours: 32.8, 
      streak: 7,
      isCurrentUser: true, 
      badge: "Climber" 
    },
    { 
      rank: 29, 
      name: "Rachel Green", 
      avatar: "/placeholder.svg", 
      points: 1020, 
      focusHours: 31.5, 
      streak: 5,
      isCurrentUser: false 
    }
  ];
};

// Get user's ranking message
export const getUserRankingMessage = (type: "friends" | "global", isEmpty = false): string => {
  if (isEmpty) {
    if (type === "friends") {
      return "Add friends to compare your progress!";
    } else {
      return "Complete focus sessions to appear on the global leaderboard!";
    }
  }
  
  if (type === "friends") {
    return "You're in 3rd place among friends this week!";
  } else {
    return "You're in the top 15% of all users this week!";
  }
};
