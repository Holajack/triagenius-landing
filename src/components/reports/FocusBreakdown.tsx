
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { getLearningMetrics, getFocusStatistics, FocusDistribution, FocusTrend, TimeOfDayMetric } from "@/utils/learningMetricsData";
import { Skeleton } from "@/components/ui/skeleton";

const FocusBreakdown = () => {
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [focusDistribution, setFocusDistribution] = useState<FocusDistribution[]>([]);
  const [focusTrends, setFocusTrends] = useState<FocusTrend[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDayMetric[]>([]);
  const [stats, setStats] = useState({
    totalHours: 0,
    avgSession: 0,
    focusScore: 0,
    improvement: ""
  });
  
  // Fetch focus data
  useEffect(() => {
    const loadFocusData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { count } = await supabase
            .from('focus_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
            
          const userHasData = count !== null && count > 0;
          setHasData(userHasData);
          
          if (userHasData) {
            // Get focus statistics
            const statistics = await getFocusStatistics();
            setStats(statistics);
            
            // Get learning metrics
            const metrics = await getLearningMetrics();
            setFocusDistribution(metrics.focusDistribution);
            setFocusTrends(metrics.focusTrends);
            setTimeOfDay(metrics.timeOfDay);
          }
        }
      } catch (error) {
        console.error('Error loading focus data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFocusData();
    
    // Set up subscription for real-time updates
    const channel = supabase
      .channel('focus-breakdown-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'focus_sessions' }, 
        () => loadFocusData()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_metrics' },
        () => loadFocusData()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 animate-pulse">
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Focus Hours</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-5xl font-bold text-primary">{stats.totalHours}</span>
              <span className="text-sm text-muted-foreground mt-1">hours this month</span>
              {hasData && stats.improvement && (
                <span className="text-sm font-medium mt-4 text-green-600">{stats.improvement} vs. last month</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Session</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-5xl font-bold text-primary">{stats.avgSession}</span>
              <span className="text-sm text-muted-foreground mt-1">minutes per session</span>
              {hasData && (
                <span className="text-sm font-medium mt-4 text-green-600">+7 min vs. last month</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Focus Score</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-5xl font-bold text-primary">{stats.focusScore}</span>
              <span className="text-sm text-muted-foreground mt-1">overall focus quality</span>
              {hasData && (
                <span className="text-sm font-medium mt-4 text-green-600">+5 pts vs. last month</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Focus Hours Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={focusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={hasData ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
                  >
                    {focusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} hours`, "Focus Time"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Focus Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={focusTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" />
                  <YAxis tickFormatter={(value) => `${value}h`} />
                  <Tooltip 
                    formatter={(value: number) => [`${value} hours`, "Focus Time"]}
                  />
                  <Bar 
                    dataKey="hours" 
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Focus Quality by Time of Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeOfDay} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <YAxis dataKey="time" type="category" width={150} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Focus Quality"]}
                  />
                  <Bar 
                    dataKey="score" 
                    fill="#82ca9d" 
                    radius={[0, 4, 4, 0]}
                    label={hasData ? { position: 'right', formatter: (value: number) => `${value}%` } : false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FocusBreakdown;
