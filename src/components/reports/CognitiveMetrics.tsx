
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

const CognitiveMetrics = () => {
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user has any focus session data
  useEffect(() => {
    const checkForFocusData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { count } = await supabase
            .from('focus_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
            
          setHasData(count !== null && count > 0);
        }
      } catch (error) {
        console.error('Error checking for focus data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkForFocusData();
  }, []);

  // Mock data for the charts
  const cognitiveData = hasData ? [
    { name: "Memory", value: 65, prevValue: 50, color: "#8884d8" },
    { name: "Problem Solving", value: 85, prevValue: 78, color: "#82ca9d" },
    { name: "Creativity", value: 45, prevValue: 42, color: "#ffc658" },
    { name: "Analytical", value: 70, prevValue: 62, color: "#ff8042" },
  ] : [
    { name: "Memory", value: 0, prevValue: 0, color: "#8884d8" },
    { name: "Problem Solving", value: 0, prevValue: 0, color: "#82ca9d" },
    { name: "Creativity", value: 0, prevValue: 0, color: "#ffc658" },
    { name: "Analytical", value: 0, prevValue: 0, color: "#ff8042" },
  ];

  const weeklyData = hasData ? [
    { day: "Mon", memory: 30, problemSolving: 45, creativity: 20, analytical: 15 },
    { day: "Tue", memory: 40, problemSolving: 35, creativity: 30, analytical: 25 },
    { day: "Wed", memory: 20, problemSolving: 55, creativity: 15, analytical: 40 },
    { day: "Thu", memory: 35, problemSolving: 25, creativity: 40, analytical: 30 },
    { day: "Fri", memory: 50, problemSolving: 40, creativity: 30, analytical: 20 },
    { day: "Sat", memory: 15, problemSolving: 20, creativity: 50, analytical: 10 },
    { day: "Sun", memory: 25, problemSolving: 30, creativity: 35, analytical: 25 },
  ] : [
    { day: "Mon", memory: 0, problemSolving: 0, creativity: 0, analytical: 0 },
    { day: "Tue", memory: 0, problemSolving: 0, creativity: 0, analytical: 0 },
    { day: "Wed", memory: 0, problemSolving: 0, creativity: 0, analytical: 0 },
    { day: "Thu", memory: 0, problemSolving: 0, creativity: 0, analytical: 0 },
    { day: "Fri", memory: 0, problemSolving: 0, creativity: 0, analytical: 0 },
    { day: "Sat", memory: 0, problemSolving: 0, creativity: 0, analytical: 0 },
    { day: "Sun", memory: 0, problemSolving: 0, creativity: 0, analytical: 0 },
  ];

  const growthData = hasData ? [
    { week: "W1", cognitive: 55 },
    { week: "W2", cognitive: 63 },
    { week: "W3", cognitive: 60 },
    { week: "W4", cognitive: 75 },
    { week: "W5", cognitive: 70 },
    { week: "W6", cognitive: 80 },
    { week: "W7", cognitive: 85 },
    { week: "W8", cognitive: 90 },
  ] : [
    { week: "W1", cognitive: 0 },
    { week: "W2", cognitive: 0 },
    { week: "W3", cognitive: 0 },
    { week: "W4", cognitive: 0 },
    { week: "W5", cognitive: 0 },
    { week: "W6", cognitive: 0 },
    { week: "W7", cognitive: 0 },
    { week: "W8", cognitive: 0 },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 animate-pulse">
        <div className="h-80 bg-muted rounded-md"></div>
        <div className="h-80 bg-muted rounded-md"></div>
        <div className="h-60 bg-muted rounded-md md:col-span-2"></div>
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
