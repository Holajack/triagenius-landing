import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Clock, User, Trophy, Flame, Brain, Sparkles } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/hooks/use-user";
import { useOnboarding } from "@/contexts/OnboardingContext";

interface ActivityUser {
  displayName: string;
  username: string;
  fullName: string | null;
  avatarUrl: string;
  isCurrentUser: boolean;
}

interface ActivityReaction {
  id: string;
  type: string;
  message: string | null;
  reactorId: string;
  reactorName: string;
  reactorAvatar: string;
  timestamp: string;
}

interface ActivityReactions {
  likes: number;
  encouragements: number;
  hasLiked: boolean;
  hasEncouraged: boolean;
  details: ActivityReaction[];
}

interface ActivityItem {
  id: string;
  userId: string;
  actionType: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  user: ActivityUser;
  reactions: ActivityReactions;
}

const ENCOURAGEMENT_OPTIONS = [
  "Keep it up!",
  "You're doing great!",
  "Amazing work!",
  "Way to go!",
  "Keep pushing!",
  "Impressive progress!",
  "You're on fire!",
  "Don't stop now!",
  "Fantastic job!",
  "Proud of you!"
];

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const ActivityFeed = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [feedType, setFeedType] = useState<"friends" | "global">("friends");
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [encourageActivity, setEncourageActivity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { state } = useOnboarding();
  
  const getEnvClasses = () => {
    switch (state.environment) {
      case 'office': 
        return {
          cardBorder: "border-blue-200",
          activeTab: "bg-blue-100 text-blue-700",
          buttonHover: "hover:bg-blue-100 active:bg-blue-200",
          likeFill: "text-blue-500"
        };
      case 'park': 
        return {
          cardBorder: "border-green-200",
          activeTab: "bg-green-100 text-green-700",
          buttonHover: "hover:bg-green-100 active:bg-green-200",
          likeFill: "text-green-500"
        };
      case 'home': 
        return {
          cardBorder: "border-orange-200",
          activeTab: "bg-orange-100 text-orange-600",
          buttonHover: "hover:bg-orange-100 active:bg-orange-200",
          likeFill: "text-orange-500"
        };
      case 'coffee-shop': 
        return {
          cardBorder: "border-amber-700",
          activeTab: "bg-amber-800/10 text-amber-800",
          buttonHover: "hover:bg-amber-100 active:bg-amber-200",
          likeFill: "text-amber-800"
        };
      case 'library': 
        return {
          cardBorder: "border-gray-200",
          activeTab: "bg-gray-100 text-gray-700",
          buttonHover: "hover:bg-gray-100 active:bg-gray-200",
          likeFill: "text-gray-500"
        };
      default: 
        return {
          cardBorder: "border-purple-200",
          activeTab: "bg-purple-100 text-purple-700",
          buttonHover: "hover:bg-purple-100 active:bg-purple-200",
          likeFill: "text-purple-500"
        };
    }
  };
  
  const envClasses = getEnvClasses();
  
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "focus_complete":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "milestone":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "streak":
        return <Flame className="h-4 w-4 text-orange-500" />;
      case "study_room":
        return <Brain className="h-4 w-4 text-purple-500" />;
      case "goal_update":
        return <Sparkles className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  const fetchActivities = async (attempt = 0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = user?.id || null;
      
      console.log(`Fetching activities (attempt ${attempt+1}/${MAX_RETRIES+1}): userId=${userId}, feedType=${feedType}`);
      
      const response = await supabase.functions.invoke('get-community-activity', {
        body: {
          userId,
          feedType,
          limit: 50
        }
      });
      
      if (response.error) {
        console.error('Error fetching activities:', response.error);
        
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          setTimeout(() => fetchActivities(attempt + 1), RETRY_DELAY);
          return;
        }
        
        setError(response.error.message || 'Failed to load activities');
        toast({
          title: "Error loading activities",
          description: response.error.message || 'An unexpected error occurred',
          variant: "destructive"
        });
      } else if (response.data?.data) {
        console.log(`Successfully fetched ${response.data.data.length} activities`);
        setActivities(response.data.data);
        setRetryCount(0);
      } else if (response.data?.error) {
        console.error('Server error:', response.data.error);
        
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          setTimeout(() => fetchActivities(attempt + 1), RETRY_DELAY);
          return;
        }
        
        setError(response.data.error);
        toast({
          title: "Error loading activities",
          description: response.data.error,
          variant: "destructive"
        });
      } else {
        console.error('Unexpected response format:', response);
        
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          setTimeout(() => fetchActivities(attempt + 1), RETRY_DELAY);
          return;
        }
        
        setError('Received an invalid response from the server');
        toast({
          title: "Error loading activities",
          description: "Received an invalid response from the server",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error invoking function:', error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        setTimeout(() => fetchActivities(attempt + 1), RETRY_DELAY);
        return;
      }
      
      setError('Network error. Please check your connection and try again.');
      toast({
        title: "Couldn't load activities",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const reactToActivity = async (activityId: string, reactionType: "like" | "encouragement", message?: string) => {
    if (!user?.id) {
      toast({
        title: "Not logged in",
        description: "Please log in to react to activities",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('react-to-activity', {
        body: {
          activityId,
          reactionType,
          message
        }
      });
      
      if (error) {
        console.error('Error reacting to activity:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else if (data?.error) {
        console.error('Server error:', data.error);
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
      } else {
        setActivities(currentActivities => {
          return currentActivities.map(activity => {
            if (activity.id === activityId) {
              const updatedReactions = { ...activity.reactions };
              
              if (reactionType === 'like') {
                if (data.action === 'added') {
                  updatedReactions.likes += 1;
                  updatedReactions.hasLiked = true;
                } else {
                  updatedReactions.likes = Math.max(0, updatedReactions.likes - 1);
                  updatedReactions.hasLiked = false;
                }
              } else if (reactionType === 'encouragement') {
                if (data.action === 'added') {
                  updatedReactions.encouragements += 1;
                  updatedReactions.hasEncouraged = true;
                  
                  if (data.data?.id) {
                    updatedReactions.details.push({
                      id: data.data.id,
                      type: 'encouragement',
                      message: message || null,
                      reactorId: user.id,
                      reactorName: user.username || 'You',
                      reactorAvatar: user.avatarUrl || '/placeholder.svg',
                      timestamp: new Date().toISOString()
                    });
                  }
                } else {
                  updatedReactions.encouragements = Math.max(0, updatedReactions.encouragements - 1);
                  updatedReactions.hasEncouraged = false;
                  
                  updatedReactions.details = updatedReactions.details.filter(
                    r => !(r.reactorId === user.id && r.type === 'encouragement')
                  );
                }
              }
              
              return { ...activity, reactions: updatedReactions };
            }
            return activity;
          });
        });
        
        if (data.action === 'added') {
          toast({
            title: reactionType === 'like' ? "Liked" : "Encouraged",
            description: reactionType === 'like' 
              ? "You liked this activity" 
              : `You sent encouragement: "${message}"`,
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('Error invoking reaction function:', error);
      toast({
        title: "Error",
        description: "Could not process your reaction",
        variant: "destructive"
      });
    }
    
    if (reactionType === 'encouragement') {
      setEncourageActivity(null);
    }
  };
  
  useEffect(() => {
    fetchActivities();
    
    const channel = supabase
      .channel('activity_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'activities' }, 
        () => {
          fetchActivities();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'activity_reactions' },
        () => {
          fetchActivities();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [feedType, user?.id]);
  
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
  
  if (!user?.id) {
    return (
      <div className="py-10 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-sm font-medium">Please Sign In</h3>
        <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
          You need to be signed in to see community activity.
        </p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-10 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-red-500/50" />
        <h3 className="mt-4 text-sm font-medium">Error Loading Activities</h3>
        <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
          {error}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={fetchActivities}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  if (activities.length === 0) {
    return (
      <div className="py-10 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-sm font-medium">No Activity Yet</h3>
        <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
          {feedType === "friends" 
            ? "Complete focus sessions or add friends to see their activity here."
            : "There hasn't been any recent activity in the community."}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={() => feedType === "friends" ? setFeedType("global") : {}}
        >
          {feedType === "friends" ? "View Global Activity" : "Try Again Later"}
        </Button>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <Tabs value={feedType} onValueChange={(value) => setFeedType(value as "friends" | "global")} className="w-full">
        <TabsList className={cn("grid w-full grid-cols-2 mb-4", envClasses.cardBorder)}>
          <TabsTrigger 
            value="friends" 
            className={cn("flex items-center gap-2", feedType === "friends" ? envClasses.activeTab : "")}
          >
            <User className="h-4 w-4" />
            <span>Friends Activity</span>
          </TabsTrigger>
          <TabsTrigger 
            value="global" 
            className={cn("flex items-center gap-2", feedType === "global" ? envClasses.activeTab : "")}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Global Activity</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends" className="mt-0 space-y-4">
          {activities.map((activity) => (
            <ActivityCard 
              key={activity.id}
              activity={activity}
              getActionIcon={getActionIcon}
              reactToActivity={reactToActivity}
              encourageActivity={encourageActivity}
              setEncourageActivity={setEncourageActivity}
              envClasses={envClasses}
            />
          ))}
        </TabsContent>
        
        <TabsContent value="global" className="mt-0 space-y-4">
          {activities.map((activity) => (
            <ActivityCard 
              key={activity.id}
              activity={activity}
              getActionIcon={getActionIcon}
              reactToActivity={reactToActivity}
              encourageActivity={encourageActivity}
              setEncourageActivity={setEncourageActivity}
              envClasses={envClasses}
            />
          ))}
        </TabsContent>
      </Tabs>
      
      {activities.length > 10 && (
        <>
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Earlier Activity</span>
            </div>
          </div>
          
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm" onClick={fetchActivities}>
              Refresh Activities
            </Button>
          </div>
        </>
      )}
    </TooltipProvider>
  );
};

interface ActivityCardProps {
  activity: ActivityItem;
  getActionIcon: (actionType: string) => React.ReactNode;
  reactToActivity: (activityId: string, reactionType: "like" | "encouragement", message?: string) => void;
  encourageActivity: string | null;
  setEncourageActivity: (activityId: string | null) => void;
  envClasses: {
    cardBorder: string;
    activeTab: string;
    buttonHover: string;
    likeFill: string;
  };
}

const ActivityCard = ({ 
  activity, 
  getActionIcon, 
  reactToActivity,
  encourageActivity,
  setEncourageActivity,
  envClasses
}: ActivityCardProps) => {
  return (
    <div 
      className={cn(
        `p-4 border rounded-lg animate-fade-in ${activity.user.isCurrentUser ? "bg-muted/10" : ""}`,
        envClasses.cardBorder
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={activity.user.avatarUrl} alt={activity.user.displayName} />
          <AvatarFallback>{activity.user.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{activity.user.displayName}</span>
            {activity.user.isCurrentUser && (
              <Badge variant="secondary" className="text-xs">You</Badge>
            )}
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              {getActionIcon(activity.actionType)}
              {activity.actionType === "focus_complete" && "Focus Session"}
              {activity.actionType === "milestone" && "Milestone"}
              {activity.actionType === "streak" && "Streak"}
              {activity.actionType === "study_room" && "Study Room"}
              {activity.actionType === "goal_update" && "Goal Update"}
            </Badge>
          </div>
          
          <p className="text-sm mt-1">{activity.description}</p>
          
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{activity.timeAgo}</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {new Date(activity.timestamp).toLocaleString()}
              </TooltipContent>
            </Tooltip>
            
            {encourageActivity === activity.id ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {ENCOURAGEMENT_OPTIONS.map((message, index) => (
                  <Badge 
                    key={index}
                    variant="outline"
                    className={cn("cursor-pointer", envClasses.buttonHover)}
                    onClick={() => reactToActivity(activity.id, "encouragement", message)}
                  >
                    {message}
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => setEncourageActivity(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={cn(
                        "flex items-center gap-1",
                        activity.reactions.hasEncouraged && "text-green-500"
                      )}
                      onClick={() => setEncourageActivity(activity.id)}
                      disabled={activity.user.isCurrentUser}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{activity.reactions.encouragements}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {activity.user.isCurrentUser 
                      ? "You can't encourage your own activity" 
                      : activity.reactions.hasEncouraged 
                        ? "You encouraged this" 
                        : "Send encouragement"}
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={cn(
                        "flex items-center gap-1",
                        activity.reactions.hasLiked && "text-red-500"
                      )}
                      onClick={() => reactToActivity(activity.id, "like")}
                      disabled={activity.user.isCurrentUser}
                    >
                      <Heart className="h-4 w-4" />
                      <span>{activity.reactions.likes}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {activity.user.isCurrentUser 
                      ? "You can't like your own activity" 
                      : activity.reactions.hasLiked 
                        ? "You liked this" 
                        : "Like this activity"}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
