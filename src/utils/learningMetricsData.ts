
import { supabase } from "@/integrations/supabase/client";

// Interfaces for learning metrics
export interface CognitiveMetric {
  name: string;
  value: number;
  prevValue: number;
  color: string;
}

export interface WeeklyMetric {
  day: string;
  memory: number;
  problemSolving: number;
  creativity: number;
  analytical: number;
}

export interface GrowthMetric {
  week: string;
  cognitive: number;
}

export interface FocusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface FocusTrend {
  week: string;
  hours: number;
}

export interface TimeOfDayMetric {
  time: string;
  score: number;
}

export interface LearningMetrics {
  cognitiveData: CognitiveMetric[];
  weeklyData: WeeklyMetric[];
  growthData: GrowthMetric[];
  focusDistribution: FocusDistribution[];
  focusTrends: FocusTrend[];
  timeOfDay: TimeOfDayMetric[];
}

// Type for our learning_metrics table
interface LearningMetricsRow {
  id: string;
  user_id: string;
  cognitive_memory: CognitiveMetric[];
  cognitive_problem_solving: CognitiveMetric[];
  cognitive_creativity: CognitiveMetric[];
  cognitive_analytical: CognitiveMetric[];
  weekly_data: WeeklyMetric[];
  growth_data: GrowthMetric[];
  focus_distribution: FocusDistribution[];
  focus_trends: FocusTrend[];
  time_of_day_data: TimeOfDayMetric[];
  created_at: string;
  updated_at: string;
}

// Default empty metrics
const emptyMetrics: LearningMetrics = {
  cognitiveData: [
    { name: "Memory", value: 0, prevValue: 0, color: "#8884d8" },
    { name: "Problem Solving", value: 0, prevValue: 0, color: "#82ca9d" },
    { name: "Creativity", value: 0, prevValue: 0, color: "#ffc658" },
    { name: "Analytical", value: 0, prevValue: 0, color: "#ff8042" },
  ],
  weeklyData: Array.from({ length: 7 }, (_, i) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return {
      day: days[i],
      memory: 0,
      problemSolving: 0,
      creativity: 0,
      analytical: 0
    };
  }),
  growthData: Array.from({ length: 8 }, (_, i) => ({
    week: `W${i+1}`,
    cognitive: 0
  })),
  focusDistribution: [
    { name: "Deep Focus", value: 0, color: "#8884d8" },
    { name: "Active Learning", value: 0, color: "#82ca9d" },
    { name: "Review & Practice", value: 0, color: "#ffc658" },
    { name: "Research & Reading", value: 0, color: "#ff8042" },
  ],
  focusTrends: Array.from({ length: 8 }, (_, i) => ({
    week: `Week ${i+1}`,
    hours: 0
  })),
  timeOfDay: [
    { time: "Early Morning (5-8 AM)", score: 0 },
    { time: "Morning (8-11 AM)", score: 0 },
    { time: "Midday (11 AM-2 PM)", score: 0 },
    { time: "Afternoon (2-5 PM)", score: 0 },
    { time: "Evening (5-8 PM)", score: 0 },
    { time: "Night (8-11 PM)", score: 0 },
    { time: "Late Night (11 PM-5 AM)", score: 0 },
  ]
};

// Function to fetch or generate metrics
export const getLearningMetrics = async (): Promise<LearningMetrics> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return emptyMetrics;

    // Check if we have existing metrics - using 'from' with string for table that's not in the types
    const { data, error } = await supabase
      .from('learning_metrics')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching learning metrics:', error);
    }

    // If we have recent metrics, return them
    if (data) {
      const metricsData = data as unknown as LearningMetricsRow;
      const updatedAt = new Date(metricsData.updated_at);
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
      
      // If metrics are less than 12 hours old, use them
      if (hoursSinceUpdate < 12) {
        return {
          cognitiveData: [
            ...(metricsData.cognitive_memory || emptyMetrics.cognitiveData.filter(m => m.name === "Memory")),
            ...(metricsData.cognitive_problem_solving || emptyMetrics.cognitiveData.filter(m => m.name === "Problem Solving")),
            ...(metricsData.cognitive_creativity || emptyMetrics.cognitiveData.filter(m => m.name === "Creativity")),
            ...(metricsData.cognitive_analytical || emptyMetrics.cognitiveData.filter(m => m.name === "Analytical")),
          ],
          weeklyData: metricsData.weekly_data || emptyMetrics.weeklyData,
          growthData: metricsData.growth_data || emptyMetrics.growthData,
          focusDistribution: metricsData.focus_distribution || emptyMetrics.focusDistribution,
          focusTrends: metricsData.focus_trends || emptyMetrics.focusTrends,
          timeOfDay: metricsData.time_of_day_data || emptyMetrics.timeOfDay
        };
      }
    }

    // Fetch user's focus sessions and tasks
    const { data: sessionData, error: sessionError } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (sessionError) {
      console.error('Error fetching session data:', sessionError);
    }

    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (taskError) {
      console.error('Error fetching task data:', taskError);
    }

    // If we don't have enough data, return empty metrics
    if (!sessionData || sessionData.length === 0) {
      return emptyMetrics;
    }

    // Generate metrics using OpenAI
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-learning-insights', {
        body: {
          userId: user.id,
          sessionData: sessionData || [],
          taskData: taskData || []
        }
      });

      if (aiError) {
        console.error('Error invoking AI function:', aiError);
        return emptyMetrics;
      }

      if (!aiData || !aiData.insights) {
        console.error('No insights returned from AI function');
        return emptyMetrics;
      }

      const insights = aiData.insights;
      
      // Format data for storage
      const cognitiveMemory = insights.cognitivePatterns?.memory || [];
      const cognitiveProblemSolving = insights.cognitivePatterns?.problemSolving || [];
      const cognitiveCreativity = insights.cognitivePatterns?.creativity || [];
      const cognitiveAnalytical = insights.cognitivePatterns?.analytical || [];

      // Store the generated metrics
      const { error: insertError } = await supabase
        .from('learning_metrics')
        .upsert({
          user_id: user.id,
          cognitive_memory: cognitiveMemory,
          cognitive_problem_solving: cognitiveProblemSolving,
          cognitive_creativity: cognitiveCreativity,
          cognitive_analytical: cognitiveAnalytical,
          weekly_data: insights.weeklyData || emptyMetrics.weeklyData,
          growth_data: insights.growthData || emptyMetrics.growthData,
          focus_distribution: insights.focusDistribution || emptyMetrics.focusDistribution,
          focus_trends: insights.focusTrends || emptyMetrics.focusTrends,
          time_of_day_data: insights.timeOfDay || emptyMetrics.timeOfDay
        } as any, { onConflict: 'user_id' });

      if (insertError) {
        console.error('Error saving learning metrics:', insertError);
      }

      // Return the generated metrics
      return {
        cognitiveData: [
          ...cognitiveMemory || emptyMetrics.cognitiveData.filter(m => m.name === "Memory"),
          ...cognitiveProblemSolving || emptyMetrics.cognitiveData.filter(m => m.name === "Problem Solving"),
          ...cognitiveCreativity || emptyMetrics.cognitiveData.filter(m => m.name === "Creativity"),
          ...cognitiveAnalytical || emptyMetrics.cognitiveData.filter(m => m.name === "Analytical"),
        ],
        weeklyData: insights.weeklyData || emptyMetrics.weeklyData,
        growthData: insights.growthData || emptyMetrics.growthData,
        focusDistribution: insights.focusDistribution || emptyMetrics.focusDistribution,
        focusTrends: insights.focusTrends || emptyMetrics.focusTrends,
        timeOfDay: insights.timeOfDay || emptyMetrics.timeOfDay
      };
    } catch (error) {
      console.error('Error generating metrics:', error);
      return emptyMetrics;
    }
  } catch (error) {
    console.error('Error in getLearningMetrics:', error);
    return emptyMetrics;
  }
};

// Type for focus statistics
export interface FocusStats {
  totalHours: number;
  avgSession: number;
  focusScore: number;
  improvement: string;
}

// Generate focus statistics
export const getFocusStatistics = async (): Promise<FocusStats> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { totalHours: 0, avgSession: 0, focusScore: 0, improvement: "0%" };

    // Get focus sessions from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessionData, error: sessionError } = await supabase
      .from('focus_sessions')
      .select('duration, milestone_count')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (sessionError) {
      console.error('Error fetching session data:', sessionError);
      return { totalHours: 0, avgSession: 0, focusScore: 0, improvement: "0%" };
    }

    if (!sessionData || sessionData.length === 0) {
      return { totalHours: 0, avgSession: 0, focusScore: 0, improvement: "0%" };
    }

    // Calculate total hours
    const totalMinutes = sessionData.reduce((sum, session) => sum + (session.duration || 0), 0);
    const totalHours = Math.round(totalMinutes / 60);

    // Calculate average session length
    const avgSession = Math.round(totalMinutes / sessionData.length);

    // Calculate focus score based on milestone completion and session length
    const totalPossibleMilestones = sessionData.length * 3; // Assuming 3 milestones per session
    const completedMilestones = sessionData.reduce((sum, session) => sum + (session.milestone_count || 0), 0);
    const milestoneRatio = totalPossibleMilestones > 0 ? completedMilestones / totalPossibleMilestones : 0;
    
    // Focus score is based on milestone completion rate (75% of score) and consistency (25% of score)
    const consistencyScore = Math.min(1, sessionData.length / 20) * 25; // Max consistency at 20 sessions per month
    const milestoneScore = milestoneRatio * 75;
    const focusScore = Math.round(consistencyScore + milestoneScore);

    return {
      totalHours,
      avgSession,
      focusScore,
      improvement: sessionData.length > 1 ? "+18%" : "0%" // Placeholder improvement value
    };
  } catch (error) {
    console.error('Error in getFocusStatistics:', error);
    return { totalHours: 0, avgSession: 0, focusScore: 0, improvement: "0%" };
  }
};
