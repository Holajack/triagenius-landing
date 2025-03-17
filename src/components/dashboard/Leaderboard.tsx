
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Award, Crown, Medal, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getFriendsLeaderboardData } from "@/utils/leaderboardData";
import { useUser } from "@/hooks/use-user";

const Leaderboard = () => {
  const { state } = useOnboarding();
  const navigate = useNavigate();
  const { user } = useUser();
  
  // Determine if this is a new user with no data
  const isNewUser = !user || (user && user.isLoading) || !user.username;
  
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
  
  // Get users from the shared data source - use empty state for new users
  const leaderboardData = getFriendsLeaderboardData(isNewUser);
  
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
                    <span className="text-xs text-muted-foreground">{user.focusHours}h</span>
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
              : `Weekly Goal: ${weeklyGoal} hours | You're in the top 15% of users this week!`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
