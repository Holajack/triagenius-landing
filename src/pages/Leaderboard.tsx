
import { useState } from "react";
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
import { getFriendsLeaderboardData, getGlobalLeaderboardData, getUserRankingMessage } from "@/utils/leaderboardData";

const Leaderboard = () => {
  const { state } = useOnboarding();
  const [leaderboardTab, setLeaderboardTab] = useState<"friends" | "global">("friends");
  
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
        <PersonalStats weeklyFocusGoal={state.weeklyFocusGoal} getAccentColor={getAccentColor} />
        
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
                <LeaderboardList type="friends" getAccentColor={getAccentColor} />
              </TabsContent>
              
              <TabsContent value="global" className="mt-0">
                <LeaderboardList type="global" getAccentColor={getAccentColor} />
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-center mt-4">
              <Button variant="outline" className="flex items-center gap-2">
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
            <ActivityFeed />
          </CardContent>
        </Card>
      </div>
      
      <NavigationBar />
    </div>
  );
};

// Personal Productivity Stats Component
const PersonalStats = ({ weeklyFocusGoal, getAccentColor }: { weeklyFocusGoal: number, getAccentColor: () => string }) => {
  const accentColor = getAccentColor();
  const currentFocusHours = 32.5; // This would come from actual user data in a real app
  const focusGoalProgress = Math.min(100, (currentFocusHours / weeklyFocusGoal) * 100);
  
  const stats = [
    { 
      icon: <Flame className="h-5 w-5" />, 
      title: "Current Streak", 
      value: "7 days", 
      progress: 70 
    },
    { 
      icon: <Clock className="h-5 w-5" />, 
      title: "Focus Time", 
      value: "32.5 hours", 
      progress: 65 
    },
    { 
      icon: <ListChecks className="h-5 w-5" />, 
      title: "Tasks Completed", 
      value: "24 this week", 
      progress: 80 
    },
  ];
  
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
          {stats.map((stat, index) => (
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
              You're {Math.round(focusGoalProgress)}% of the way to your {weeklyFocusGoal}-hour weekly focus goal
            </p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-semibold block">{currentFocusHours}/{weeklyFocusGoal}</span>
            <span className="text-xs text-muted-foreground">hours</span>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="flex items-center gap-1 px-3 py-1">
            <Sparkles className="h-3 w-3" />
            Level 8
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
            <Flame className="h-3 w-3" />
            Streak Master
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            <Brain className="h-3 w-3" />
            Deep Worker
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
            <Clock className="h-3 w-3" />
            50+ Hours
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// Leaderboard List Component
const LeaderboardList = ({ 
  type, 
  getAccentColor 
}: { 
  type: "friends" | "global", 
  getAccentColor: () => string 
}) => {
  const accentColor = getAccentColor();
  
  const leaderboardData = type === "friends" 
    ? getFriendsLeaderboardData() 
    : getGlobalLeaderboardData();
  
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
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 text-xs text-muted-foreground px-2 pb-2 border-b">
        <div className="col-span-1">#</div>
        <div className="col-span-5">User</div>
        <div className="col-span-2 text-center">Points</div>
        <div className="col-span-2 text-center">Hours</div>
        <div className="col-span-2 text-center">Streak</div>
      </div>
      
      {leaderboardData.map((user) => (
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
            <span className="text-sm">{user.focusHours}h</span>
          </div>
          
          <div className="col-span-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className={`h-4 w-4 ${user.streak > 5 ? "text-orange-500" : "text-muted-foreground"}`} />
              <span className="text-sm">{user.streak}</span>
            </div>
          </div>
        </div>
      ))}
      
      <div className="text-center mt-2">
        <p className="text-xs text-muted-foreground">
          {getUserRankingMessage(type)}
        </p>
      </div>
    </div>
  );
};

// Activity Feed Component
const ActivityFeed = () => {
  const activityData = [
    {
      id: 1,
      user: "John Smith",
      avatar: "/placeholder.svg",
      action: "completed a 2-hour deep work session",
      time: "10 minutes ago",
      likes: 3,
      comments: 1,
      isLiked: false
    },
    {
      id: 2,
      user: "Sarah Johnson",
      avatar: "/placeholder.svg",
      action: "achieved a 10-day focus streak",
      time: "1 hour ago",
      likes: 12,
      comments: 4,
      isLiked: true
    },
    {
      id: 3,
      user: "AI Assistant",
      avatar: "/placeholder.svg",
      action: "shared a tip: Take a 5-minute break every 25 minutes to maximize focus",
      time: "2 hours ago",
      likes: 8,
      comments: 2,
      isLiked: false,
      isAI: true
    },
    {
      id: 4,
      user: "Michael Chen",
      avatar: "/placeholder.svg",
      action: "completed 15 tasks today",
      time: "3 hours ago",
      likes: 5,
      comments: 0,
      isLiked: false
    },
    {
      id: 5,
      user: "Emily Wilson",
      avatar: "/placeholder.svg",
      action: "shared study notes on Machine Learning fundamentals",
      time: "5 hours ago",
      likes: 9,
      comments: 3,
      isLiked: true
    }
  ];
  
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
    </div>
  );
};

export default Leaderboard;
