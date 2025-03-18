
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Award, Crown, Medal, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getFriendsLeaderboardData } from "@/utils/leaderboardData";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { LeaderboardUser } from "@/utils/leaderboardData";

const Leaderboard = () => {
  const { state } = useOnboarding();
  const navigate = useNavigate();
  const { user } = useUser();
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState("");
  
  // Check if the user has any focus session data
  useEffect(() => {
    const checkForFocusData = async () => {
      try {
        setIsLoading(true);
        const { data: authData } = await supabase.auth.getUser();
        
        if (authData?.user) {
          const { count, error } = await supabase
            .from('focus_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authData.user.id);
            
          setHasData(count !== null && count > 0);
          
          // Load real leaderboard data
          const realData = await getFriendsLeaderboardData(count === 0);
          setLeaderboardData(realData);
          
          // Get user ranking
          if (count && count > 0) {
            // Get total users for percentage calculation
            const { count: totalUsers } = await supabase
              .from('leaderboard_stats')
              .select('*', { count: 'exact', head: true });
              
            if (totalUsers) {
              // Find current user position
              const { data: allStats } = await supabase
                .from('leaderboard_stats')
                .select('user_id, points')
                .order('points', { ascending: false });
                
              const userPosition = allStats?.findIndex(stat => stat.user_id === authData.user.id) || -1;
              
              if (userPosition >= 0) {
                const percentage = Math.round(((userPosition + 1) / (totalUsers || 1)) * 100);
                setUserRank(`You're in the top ${percentage}% of users this week!`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking for focus data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkForFocusData();
    
    // Set up real-time subscription for leaderboard updates
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'leaderboard_stats' }, 
        async () => {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            const { count } = await supabase
              .from('focus_sessions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', authData.user.id);
              
            const realData = await getFriendsLeaderboardData(count === 0);
            setLeaderboardData(realData);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Determine if this is a new user with no data
  const isNewUser = isLoading || !hasData || !user || (user && user.isLoading) || !user.username;
  
  // Get accent color based on environment
  const getAccentColor = () => {
    switch (state.environment) {
      case 'office': return "text-blue-600 bg-blue-50";
      case 'park': return "text-green-600 bg-green-50";
      case 'home': return "text-orange-600 bg-orange-50";
      case 'coffee-shop': return "text-amber-600 bg-amber-50";
      case 'library': return "text-gray-600 bg-gray-50";
      default: return "text-triage-purple bg-purple-50";
    }
  };
  
  const getProgressColor = () => {
    switch (state.environment) {
      case 'office': return "bg-blue-600";
      case 'park': return "bg-green-600";
      case 'home': return "bg-orange-600";
      case 'coffee-shop': return "bg-amber-600";
      case 'library': return "bg-gray-600";
      default: return "bg-triage-purple";
    }
  };
  
  // Use the user's weekly focus goal for progress calculations
  // Make sure to provide a fallback value if it's not set
  const weeklyGoal = state.weeklyFocusGoal || 10;
  
  // Get badge based on rank
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Medal className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="text-xs font-medium">{rank}</span>;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-triage-purple" />
              Focus Leaderboard
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="animate-pulse">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted"></div>
                  <div className="w-8 h-8 rounded-full bg-muted"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                    <div className="h-2 bg-muted rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Award className="w-5 h-5 mr-2 text-triage-purple" />
            Focus Leaderboard
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground"
            onClick={() => navigate("/leaderboard")}
          >
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isNewUser ? (
          <div className="py-6 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-sm font-medium">No Focus Data Yet</h3>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
              Complete your first focus session to start building your stats and compare with others!
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => navigate("/focus-session")}
            >
              Start Your First Session
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboardData.map((user) => (
              <div 
                key={user.rank}
                className={`flex items-center gap-3 p-2 rounded-md ${
                  user.isCurrentUser ? "bg-muted/50" : ""
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {getRankBadge(user.rank)}
                </div>
                
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className={`text-sm font-medium truncate ${user.isCurrentUser ? getAccentColor().split(" ")[0] : ""}`}>
                      {user.name}
                    </p>
                    <span className="text-xs text-muted-foreground">{user.focusHours.toFixed(1)}h</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (user.focusHours / weeklyGoal) * 100)} 
                    className="h-1.5" 
                    indicatorClassName={user.isCurrentUser ? getProgressColor() : ""}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-center mt-3">
          <p className="text-xs text-muted-foreground">
            {isNewUser 
              ? "Set a focus goal and start tracking your progress!" 
              : userRank || `Weekly Goal: ${weeklyGoal} hours`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
