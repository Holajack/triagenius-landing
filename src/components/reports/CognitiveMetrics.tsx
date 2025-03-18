
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
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getLearningMetrics, CognitiveMetric, WeeklyMetric, GrowthMetric } from "@/utils/learningMetricsData";
import { Skeleton } from "@/components/ui/skeleton";

const CognitiveMetrics = () => {
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cognitiveData, setCognitiveData] = useState<CognitiveMetric[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyMetric[]>([]);
  const [growthData, setGrowthData] = useState<GrowthMetric[]>([]);
  
  // Fetch metrics data
  useEffect(() => {
    const loadMetricsData = async () => {
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
            const metrics = await getLearningMetrics();
            setCognitiveData(metrics.cognitiveData);
            setWeeklyData(metrics.weeklyData);
            setGrowthData(metrics.growthData);
          }
        }
      } catch (error) {
        console.error('Error loading metrics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMetricsData();
    
    // Set up subscription for real-time updates
    const channel = supabase
      .channel('cognitive-metrics-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'focus_sessions' }, 
        () => loadMetricsData()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_metrics' },
        () => loadMetricsData()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 animate-pulse">
        <Skeleton className="h-80 w-full rounded-md" />
        <Skeleton className="h-80 w-full rounded-md" />
        <Skeleton className="h-60 w-full rounded-md md:col-span-2" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Cognitive Skills Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cognitiveData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={hasData ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
                  labelLine={false}
                >
                  {cognitiveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, "Skill Level"]}
                  labelFormatter={(name) => `${name}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Weekly Cognitive Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(value) => `${value}min`} />
                <Tooltip
                  formatter={(value: number) => [`${value} min`, "Duration"]}
                />
                <Legend iconType="circle" />
                <Bar dataKey="memory" name="Memory" fill="#8884d8" />
                <Bar dataKey="problemSolving" name="Problem Solving" fill="#82ca9d" />
                <Bar dataKey="creativity" name="Creativity" fill="#ffc658" />
                <Bar dataKey="analytical" name="Analytical" fill="#ff8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Cognitive Growth Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Cognitive Capacity"]}
                />
                <Line
                  type="monotone"
                  dataKey="cognitive"
                  stroke="#8884d8"
                  strokeWidth={3}
                  dot={{ stroke: '#8884d8', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CognitiveMetrics;
