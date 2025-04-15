
import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
  Crown,
  Medal,
  ChevronDown,
  Info
} from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { 
  getFriendsLeaderboardData, 
  getGlobalLeaderboardData, 
  getUserRankingMessage,
  getCommunityActivityFeed,
  LeaderboardUser
} from "@/utils/leaderboardData";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import LeaderboardSkeletonList from "@/components/leaderboard/LeaderboardSkeletonList";
import ActivityFeed from "@/components/leaderboard/ActivityFeed";
import confetti from 'canvas-confetti';
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [hasFriends, setHasFriends] = useState(false);
  
  const isNewUser = !user || (user && user.isLoading) || !user.username;
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        if (user?.id) {
          const { data: statsData, error: statsError } = await supabase
            .from('leaderboard_stats')
            .select('current_streak, weekly_focus_time')
            .eq('user_id', user.id)
            .single();
            
          if (!statsError && statsData) {
            const { count: completedTasksCount } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('status', 'completed');
              
            setPersonalStats({
              streak: statsData.current_streak || 0,
              focusTime: (statsData.weekly_focus_time || 0) / 60,
              tasksCompleted: completedTasksCount || 0
            });
          }
          
          // Check if user has any friends
          const { data: friendsData, error: friendsError } = await supabase
            .from('friends')
            .select('friend_id')
            .eq('user_id', user.id);
            
          setHasFriends(Boolean(friendsData && friendsData.length > 0));
        }
        
        const friends = await getFriendsLeaderboardData(isNewUser);
        setFriendsData(friends);
        
        const global = await getGlobalLeaderboardData(isNewUser);
        setGlobalData(global);
        
        const friendsMessage = await getUserRankingMessage("friends", isNewUser);
        setFriendsRankingMessage(friendsMessage);
        
        const globalMessage = await getUserRankingMessage("global", isNewUser);
        setGlobalRankingMessage(globalMessage);
        
        const activity = await getCommunityActivityFeed(isNewUser);
        setActivityData(activity);
      } catch (error) {
        console.error('Error loading leaderboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    const channel = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'leaderboard_stats' }, 
        async () => {
          const friends = await getFriendsLeaderboardData(isNewUser);
          setFriendsData(friends);
          
          const global = await getGlobalLeaderboardData(isNewUser);
          setGlobalData(global);
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'focus_sessions' },
        async () => {
          const activity = await getCommunityActivityFeed(isNewUser);
          setActivityData(activity);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isNewUser]);
  
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
    <TooltipProvider>
      <div className="container pb-20">
        <PageHeader 
          title="Leaderboard" 
          subtitle="Track your progress and compare with others"
        />
        
        <div className="space-y-8">
          <PersonalStats 
            weeklyFocusGoal={state.weeklyFocusGoal} 
            getAccentColor={getAccentColor} 
            isNewUser={isNewUser}
            isLoading={isLoading}
            stats={personalStats}
          />
          
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
                  <ScrollArea className="h-[500px]">
                    <LeaderboardList 
                      type="friends" 
                      getAccentColor={getAccentColor} 
                      isNewUser={isNewUser} 
                      isLoading={isLoading}
                      data={friendsData}
                      hasFriends={hasFriends}
                      rankingMessage={friendsRankingMessage}
                    />
                  </ScrollArea>
                  
                  <div className="flex justify-center mt-4">
                    <Button variant="outline" className="flex items-center gap-2" onClick={() => window.location.href = "/community"}>
                      <Users className="h-4 w-4" />
                      {hasFriends ? "Find More Friends" : "Add Friends"}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="global" className="mt-0">
                  <ScrollArea className="h-[500px]">
                    <GlobalRankingsTab />
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-triage-purple" />
                Community Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed />
            </CardContent>
          </Card>
        </div>
        
        <NavigationBar />
      </div>
    </TooltipProvider>
  );
};

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

const LeaderboardList = ({ 
  type, 
  getAccentColor,
  isNewUser,
  isLoading,
  data,
  hasFriends,
  rankingMessage
}: { 
  type: "friends" | "global", 
  getAccentColor: () => string,
  isNewUser: boolean,
  isLoading: boolean,
  data: LeaderboardUser[],
  hasFriends?: boolean,
  rankingMessage: string
}) => {
  const accentColor = getAccentColor();
  const [celebratedUsers, setCelebratedUsers] = useState<Set<string>>(new Set());
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        currentUserId.current = user.id;
      }
    };
    
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (isLoading || isNewUser || data.length === 0) return;
    
    const currentUserInTop3 = data.find(
      (user) => user.isCurrentUser && user.rank <= 3 && !celebratedUsers.has(user.id as string)
    );
    
    if (currentUserInTop3) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9b87f5', '#D946EF', '#F97316', '#0EA5E9']
      });
      
      setCelebratedUsers(prev => {
        const updated = new Set(prev);
        updated.add(currentUserInTop3.id as string);
        return updated;
      });
    }
  }, [data, isLoading, isNewUser, celebratedUsers]);
  
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
  
  // Show empty state if user has no friends and this is the friends tab
  if (type === "friends" && data.length === 0 && hasFriends === false && !isNewUser) {
    return (
      <div className="py-12 text-center">
        <Users className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Friends Yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
          Add friends to see how your focus time compares and motivate each other!
        </p>
        <Button 
          variant="default" 
          onClick={() => window.location.href = "/community"}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Find Friends
        </Button>
      </div>
    );
  }
  
  // Special handling for when the user has friends but no data is available
  if (type === "friends" && data.length === 0 && hasFriends === true && !isNewUser) {
    return (
      <div className="py-8 text-center">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
        <h3 className="font-medium mb-2">No Focus Data Yet</h3>
        <p className="text-sm text-muted-foreground">
          Your friends haven't logged any focus sessions this week. Check back later!
        </p>
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
          <Tooltip key={user.rank}>
            <TooltipTrigger asChild>
              <div 
                className={`grid grid-cols-12 items-center py-3 px-2 rounded-md cursor-pointer hover:bg-muted/30 transition-colors ${
                  user.isCurrentUser ? "bg-muted/50" : ""
                } ${
                  user.rank <= 3 ? "border-l-4 " + (
                    user.rank === 1 ? "border-l-yellow-500" : 
                    user.rank === 2 ? "border-l-gray-400" : 
                    "border-l-amber-600"
                  ) : ""
                }`}
              >
                <div className="col-span-1 flex items-center justify-center">
                  {getRankBadge(user.rank)}
                </div>
                
                <div className="col-span-5 flex items-center gap-3">
                  <Avatar className={`h-8 w-8 border ${user.rank <= 3 ? "ring-2 " + (
                    user.rank === 1 ? "ring-yellow-500" : 
                    user.rank === 2 ? "ring-gray-400" : 
                    "ring-amber-600"
                  ) : ""}`}>
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
            </TooltipTrigger>
            <TooltipContent side="right" className="p-4 space-y-2 w-64 backdrop-blur-sm bg-popover/95">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{user.name}</h4>
                  {user.username !== user.name && user.username && (
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Rank: #{user.rank}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  <span>Points: {user.points}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Focus: {user.focusHours.toFixed(1)}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>Streak: {user.streak} days</span>
                </div>
              </div>
              
              {user.badge && (
                <div className="pt-1 border-t">
                  <Badge className="w-full justify-center gap-1 py-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    {user.badge}
                  </Badge>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
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

const GlobalRankingsTab = () => {
  const { state } = useOnboarding();
  const [globalData, setGlobalData] = useState<LeaderboardUser[]>([]);
  const [userRankMessage, setUserRankMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [celebratedUsers, setCelebratedUsers] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const fetchGlobalData = async () => {
      setLoading(true);
      try {
        const data = await getGlobalLeaderboardData();
        setGlobalData(data);
        
        const message = await getUserRankingMessage("global");
        setUserRankMessage(message);
      } catch (error) {
        console.error("Error fetching global leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGlobalData();
    
    const channel = supabase
      .channel('global-leaderboard-updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'leaderboard_stats' }, 
        async () => {
          const data = await getGlobalLeaderboardData();
          setGlobalData(data);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  useEffect(() => {
    if (loading || globalData.length === 0) return;
    
    const currentUserInTop3 = globalData.find(
      (user) => user.isCurrentUser && user.rank <= 3 && !celebratedUsers.has(user.id as string)
    );
    
    if (currentUserInTop3) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9b87f5', '#D946EF', '#F97316', '#0EA5E9']
      });
      
      setCelebratedUsers(prev => {
        const updated = new Set(prev);
        updated.add(currentUserInTop3.id as string);
        return updated;
      });
    }
  }, [globalData, loading, celebratedUsers]);
  
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
  
  if (loading) {
    return <LeaderboardSkeletonList count={10} />;
  }
  
  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="space-y-4">
          {globalData.map((user, index) => {
            if (user.isSeparator) {
              return (
                <div key={`separator-${index}`} className="flex justify-center py-2">
                  <ChevronDown className="h-6 w-6 text-muted-foreground" />
                </div>
              );
            }
            
            return (
              <Tooltip key={`${user.rank}-${index}`}>
                <TooltipTrigger asChild>
                  <div 
                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-muted/30 transition-colors ${
                      user.isCurrentUser ? "bg-muted/50" : ""
                    } ${
                      user.rank <= 3 ? "border-l-4 " + (
                        user.rank === 1 ? "border-l-yellow-500" : 
                        user.rank === 2 ? "border-l-gray-400" : 
                        "border-l-amber-600"
                      ) : ""
                    }`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      {getRankBadge(user.rank)}
                    </div>
                    
                    <Avatar className={`h-8 w-8 border ${user.rank <= 3 ? "ring-2 " + (
                      user.rank === 1 ? "ring-yellow-500" : 
                      user.rank === 2 ? "ring-gray-400" : 
                      "ring-amber-600"
                    ) : ""}`}>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <p className={`text-sm font-medium truncate ${user.isCurrentUser ? "text-triage-purple" : ""}`}>
                            {user.name}
                          </p>
                          {user.badge && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {user.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{user.focusHours.toFixed(1)}h</span>
                          <span>{user.points} pts</span>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(100, user.points / 10)} 
                        className="h-1.5" 
                        indicatorClassName={user.isCurrentUser ? getProgressColor() : ""}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="p-4 space-y-2 w-64 backdrop-blur-sm bg-popover/95">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{user.name}</h4>
                      {user.username !== user.name && user.username && (
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span>Rank: #{user.rank}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      <span>Points: {user.points}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>Focus: {user.focusHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>Streak: {user.streak} days</span>
                    </div>
                  </div>
                  
                  {user.badge && (
                    <div className="pt-1 border-t">
                      <Badge className="w-full justify-center gap-1 py-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        {user.badge}
                      </Badge>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            {userRankMessage}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Leaderboard;

