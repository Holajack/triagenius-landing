
import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { 
  Award, 
  Clock, 
  Flame, 
  ListChecks, 
  Users, 
  User, 
  Trophy, 
  MessageCircle, 
  Heart, 
  Brain,
  Target,
  Sparkles,
} from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { 
  getFriendsLeaderboardData, 
  getGlobalLeaderboardData, 
  getUserRankingMessage,
  getCommunityActivityFeed
} from "@/utils/leaderboardData";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { LeaderboardUser } from "@/utils/leaderboardData";

const Leaderboard = () => {
  const { state } = useOnboarding();
  const { user } = useUser();
  const [leaderboardTab, setLeaderboardTab] = useState<"friends" | "global">("friends");
  const [isLoading, setIsLoading] = useState(true);
  const [personalStats, setPersonalStats] = useState({
    streak: 0,
    focusTime: 0,
    tasksCompleted: 0
  });
  const [friendsData, setFriendsData] = useState<LeaderboardUser[]>([]);
  const [globalData, setGlobalData] = useState<LeaderboardUser[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [friendsRankingMessage, setFriendsRankingMessage] = useState("");
  const [globalRankingMessage, setGlobalRankingMessage] = useState("");
  
  // Determine if this is a new user with no data
  const isNewUser = !user || (user && user.isLoading) || !user.username;
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Load personal stats
        if (user?.id) {
          const { data: statsData, error: statsError } = await supabase
            .from('leaderboard_stats')
            .select('current_streak, weekly_focus_time')
            .eq('user_id', user.id)
            .single();
            
          if (!statsError && statsData) {
            // Get completed tasks count
            const { count: completedTasksCount } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('status', 'completed');
              
            setPersonalStats({
              streak: statsData.current_streak || 0,
              focusTime: (statsData.weekly_focus_time || 0) / 60, // Convert minutes to hours
              tasksCompleted: completedTasksCount || 0
            });
          }
        }
        
        // Load friends leaderboard data
        const friends = await getFriendsLeaderboardData(isNewUser);
        setFriendsData(friends);
        
        // Load global leaderboard data
        const global = await getGlobalLeaderboardData(isNewUser);
        setGlobalData(global);
        
        // Load ranking messages
        const friendsMessage = await getUserRankingMessage("friends", isNewUser);
        setFriendsRankingMessage(friendsMessage);
        
        const globalMessage = await getUserRankingMessage("global", isNewUser);
        setGlobalRankingMessage(globalMessage);
        
        // Load activity feed
        const activity = await getCommunityActivityFeed(isNewUser);
        setActivityData(activity);
      } catch (error) {
        console.error('Error loading leaderboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Set up real-time subscription for leaderboard updates
    const channel = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'leaderboard_stats' }, 
        async () => {
          // Refresh leaderboard data when any stats are updated
          const friends = await getFriendsLeaderboardData(isNewUser);
          setFriendsData(friends);
          
          const global = await getGlobalLeaderboardData(isNewUser);
          setGlobalData(global);
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'focus_sessions' },
        async () => {
          // Refresh activity feed when new focus sessions are added
          const activity = await getCommunityActivityFeed(isNewUser);
          setActivityData(activity);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isNewUser]);
  
  // Get accent color based on environment
  const getAccentColor = () => {
    switch (state.environment) {
      case 'office': return "text-blue-600";
      case 'park': return "text-green-600";
      case 'home': return "text-orange-600";
      case 'coffee-shop': return "text-amber-600";
      case 'library': return "text-gray-600";
      default: return "text-triage-purple";
    }
  };
  
  return (
    <div className="container pb-20">
      <PageHeader 
        title="Leaderboard" 
        subtitle="Track your progress and compare with others"
      />
      
      <div className="space-y-8">
        {/* Personal Productivity Stats */}
        <PersonalStats 
          weeklyFocusGoal={state.weeklyFocusGoal} 
          getAccentColor={getAccentColor} 
          isNewUser={isNewUser}
          isLoading={isLoading}
          stats={personalStats}
        />
        
        {/* Leaderboard Rankings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Trophy className="w-5 h-5 text-triage-purple" />
              Leaderboard Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="friends" 
              value={leaderboardTab} 
              onValueChange={(value) => setLeaderboardTab(value as "friends" | "global")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="friends" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Friends</span>
                </TabsTrigger>
                <TabsTrigger value="global" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span>Global</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="friends" className="mt-0">
                <LeaderboardList 
                  type="friends" 
                  getAccentColor={getAccentColor} 
                  isNewUser={isNewUser} 
                  isLoading={isLoading}
                  data={friendsData}
                  rankingMessage={friendsRankingMessage}
                />
              </TabsContent>
              
              <TabsContent value="global" className="mt-0">
                <LeaderboardList 
                  type="global" 
                  getAccentColor={getAccentColor} 
                  isNewUser={isNewUser}
                  isLoading={isLoading}
                  data={globalData}
                  rankingMessage={globalRankingMessage}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-center mt-4">
              <Button variant="outline" className="flex items-center gap-2" onClick={() => window.location.href = "/community"}>
                <Users className="h-4 w-4" />
                Add Friends
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Community Activity Feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-triage-purple" />
              Community Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed 
              isNewUser={isNewUser} 
              isLoading={isLoading}
              activityData={activityData}
            />
          </CardContent>
        </Card>
      </div>
      
      <NavigationBar />
    </div>
  );
};

// Personal Productivity Stats Component
const PersonalStats = ({ 
  weeklyFocusGoal, 
  getAccentColor, 
  isNewUser,
  isLoading,
  stats
}: { 
  weeklyFocusGoal: number, 
  getAccentColor: () => string,
  isNewUser: boolean,
  isLoading: boolean,
  stats: {
    streak: number;
    focusTime: number;
    tasksCompleted: number;
  }
}) => {
  const accentColor = getAccentColor();
  // For new users, start with 0 focus hours
  const currentFocusHours = isNewUser ? 0 : stats.focusTime; 
  const focusGoalProgress = Math.min(100, (currentFocusHours / weeklyFocusGoal) * 100);
  
  const statsData = [
    { 
      icon: <Flame className="h-5 w-5" />, 
      title: "Current Streak", 
      value: isNewUser ? "0 days" : `${stats.streak} days`, 
      progress: isNewUser ? 0 : Math.min(100, stats.streak * 10) 
    },
    { 
      icon: <Clock className="h-5 w-5" />, 
      title: "Focus Time", 
      value: isNewUser ? "0 hours" : `${currentFocusHours.toFixed(1)} hours`, 
      progress: isNewUser ? 0 : Math.min(100, (currentFocusHours / weeklyFocusGoal) * 100) 
    },
    { 
      icon: <ListChecks className="h-5 w-5" />, 
      title: "Tasks Completed", 
      value: isNewUser ? "0 this week" : `${stats.tasksCompleted} this week`, 
      progress: isNewUser ? 0 : Math.min(100, stats.tasksCompleted * 5) 
    },
  ];
  
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="w-5 h-5 text-triage-purple" />
            Personal Productivity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="flex-1">
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded mb-3"></div>
                    <div className="h-2 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="h-24 bg-muted/50 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <User className="w-5 h-5 text-triage-purple" />
          Personal Productivity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {statsData.map((stat, index) => (
            <Card key={index} className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`${accentColor} flex items-center gap-2`}>
                    {stat.icon}
                    <span className="font-medium">{stat.title}</span>
                  </div>
                  <Badge variant="secondary">{stat.value}</Badge>
                </div>
                <Progress value={stat.progress} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Target className="h-5 w-5 text-triage-purple" />
              Weekly Focus Goal
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isNewUser 
                ? `Start your first focus session to track progress towards your ${weeklyFocusGoal}-hour weekly goal`
                : `You're ${Math.round(focusGoalProgress)}% of the way to your ${weeklyFocusGoal}-hour weekly focus goal`
              }
            </p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-semibold block">{currentFocusHours.toFixed(1)}/{weeklyFocusGoal}</span>
            <span className="text-xs text-muted-foreground">hours</span>
          </div>
        </div>
        
        {!isNewUser && stats.focusTime > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="flex items-center gap-1 px-3 py-1">
              <Sparkles className="h-3 w-3" />
              {stats.focusTime >= 50 ? "Expert" : stats.focusTime >= 20 ? "Intermediate" : "Beginner"}
            </Badge>
            {stats.streak >= 5 && (
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                <Flame className="h-3 w-3" />
                {stats.streak >= 20 ? "Streak Master" : stats.streak >= 10 ? "Consistent" : "Streak Builder"}
              </Badge>
            )}
            {stats.tasksCompleted >= 10 && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                <Brain className="h-3 w-3" />
                "Task Champion"
              </Badge>
            )}
            {stats.focusTime >= 50 && (
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                <Clock className="h-3 w-3" />
                "50+ Hours"
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Leaderboard List Component
const LeaderboardList = ({ 
  type, 
  getAccentColor,
  isNewUser,
  isLoading,
  data,
  rankingMessage
}: { 
  type: "friends" | "global", 
  getAccentColor: () => string,
  isNewUser: boolean,
  isLoading: boolean,
  data: LeaderboardUser[],
  rankingMessage: string
}) => {
  const accentColor = getAccentColor();
  
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Trophy className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium">{rank}</span>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-12 text-xs text-muted-foreground px-2 pb-2 border-b">
          <div className="col-span-1">#</div>
          <div className="col-span-5">User</div>
          <div className="col-span-2 text-center">Points</div>
          <div className="col-span-2 text-center">Hours</div>
          <div className="col-span-2 text-center">Streak</div>
        </div>
        
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-12 items-center py-3 px-2">
              <div className="col-span-1 h-5 bg-muted rounded"></div>
              <div className="col-span-5 flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
              <div className="col-span-2 h-4 bg-muted rounded mx-auto w-12"></div>
              <div className="col-span-2 h-4 bg-muted rounded mx-auto w-10"></div>
              <div className="col-span-2 h-4 bg-muted rounded mx-auto w-8"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 text-xs text-muted-foreground px-2 pb-2 border-b">
        <div className="col-span-1">#</div>
        <div className="col-span-5">User</div>
        <div className="col-span-2 text-center">Points</div>
        <div className="col-span-2 text-center">Hours</div>
        <div className="col-span-2 text-center">Streak</div>
      </div>
      
      {data.length > 0 ? (
        data.map((user) => (
          <div 
            key={user.rank}
            className={`grid grid-cols-12 items-center py-3 px-2 rounded-md ${
              user.isCurrentUser ? "bg-muted/50" : ""
            }`}
          >
            <div className="col-span-1 flex items-center justify-center">
              {getRankBadge(user.rank)}
            </div>
            
            <div className="col-span-5 flex items-center gap-3">
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${user.isCurrentUser ? accentColor : ""}`}>
                  {user.name}
                </p>
                {user.badge && (
                  <Badge variant="outline" className="text-xs">
                    {user.badge}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="col-span-2 text-center font-semibold">
              {user.points}
            </div>
            
            <div className="col-span-2 text-center">
              <span className="text-sm">{user.focusHours.toFixed(1)}h</span>
            </div>
            
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className={`h-4 w-4 ${user.streak > 5 ? "text-orange-500" : "text-muted-foreground"}`} />
                <span className="text-sm">{user.streak}</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="py-8 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">
            {type === "friends" 
              ? "Add friends to see them on your leaderboard!" 
              : "No leaderboard data available yet."}
          </p>
        </div>
      )}
      
      <div className="text-center mt-2">
        <p className="text-xs text-muted-foreground">
          {rankingMessage}
        </p>
      </div>
    </div>
  );
};

// Activity Feed Component
const ActivityFeed = ({ 
  isNewUser, 
  isLoading,
  activityData 
}: { 
  isNewUser: boolean,
  isLoading: boolean,
  activityData: any[]
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-3"></div>
                <div className="flex gap-4">
                  <div className="h-3 bg-muted rounded w-16"></div>
                  <div className="h-3 bg-muted rounded w-10"></div>
                  <div className="h-3 bg-muted rounded w-10"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (isNewUser || activityData.length === 0) {
    return (
      <div className="py-10 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-sm font-medium">No Community Activity Yet</h3>
        <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
          Complete focus sessions and interact with other users to see community activity here.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={() => window.location.href = "/community"}
        >
          Explore Community
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {activityData.map((activity) => (
        <div 
          key={activity.id} 
          className={`p-4 border rounded-lg ${activity.isAI ? "bg-purple-50 dark:bg-purple-900/10" : ""}`}
        >
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={activity.avatar} alt={activity.user} />
              <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{activity.user}</span>
                {activity.isAI && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    AI Insight
                  </Badge>
                )}
              </div>
              
              <p className="text-sm mt-1">{activity.action}</p>
              
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>{activity.time}</span>
                <button className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{activity.comments}</span>
                </button>
                <button className={`flex items-center gap-1 ${activity.isLiked ? "text-red-500" : ""}`}>
                  <Heart className="h-4 w-4" />
                  <span>{activity.likes}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {activityData.length > 5 && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Earlier Activity</span>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button variant="outline" size="sm">
              View More
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
