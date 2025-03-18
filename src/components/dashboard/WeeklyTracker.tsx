
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";

type ChartType = "bar" | "pie" | "line" | "time";

interface WeeklyTrackerProps {
  chartType: ChartType;
  hasData?: boolean;
  optimizeForMobile?: boolean;
}

// Generate empty data for the weekly tracker
const generateEmptyData = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  return days.map(day => ({
    day,
    total: 0,
    Math: 0,
    Physics: 0,
    History: 0,
    English: 0,
    Chemistry: 0
  }));
};

// Generate empty data for the pie chart
const generateEmptyPieData = () => {
  const subjects = ["Math", "Physics", "History", "English", "Chemistry"];
  
  return subjects.map(name => ({
    name,
    value: 0
  }));
};

const WeeklyTracker = ({ chartType, hasData = true, optimizeForMobile = false }: WeeklyTrackerProps) => {
  const { state } = useOnboarding();
  const { user } = useUser();
  const [data, setData] = useState(() => {
    // First try to load from localStorage
    const savedData = localStorage.getItem('weeklyTrackerData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing saved weekly data', e);
      }
    }
    return generateEmptyData();
  });
  
  const [pieData, setPieData] = useState(() => {
    // First try to load from localStorage
    const savedPieData = localStorage.getItem('weeklyPieData');
    if (savedPieData) {
      try {
        return JSON.parse(savedPieData);
      } catch (e) {
        console.error('Error parsing saved pie data', e);
      }
    }
    return generateEmptyPieData();
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [noDataAvailable, setNoDataAvailable] = useState(false);
  
  // Fetch real focus session data
  useEffect(() => {
    const fetchFocusData = async () => {
      setIsLoading(true);
      
      try {
        // Get current week's start and end dates
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
        const startOfWeek = new Date(now);
        // Adjust to get Monday as start of week (if dayOfWeek is 0/Sunday, go back 6 days)
        startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        // Check if we have a logged-in user
        if (user && user.id) {
          // Fetch focus sessions for the current week
          const { data: focusSessions, error } = await supabase
            .from('focus_sessions')
            .select('*')
            .eq('user_id', user.id)
            .gte('start_time', startOfWeek.toISOString())
            .lte('start_time', endOfWeek.toISOString());
            
          if (error) {
            console.error('Error fetching focus sessions:', error);
            // Use cached data if available
            const cachedData = localStorage.getItem('weeklyTrackerData');
            const cachedPieData = localStorage.getItem('weeklyPieData');
            
            if (cachedData && cachedPieData) {
              setData(JSON.parse(cachedData));
              setPieData(JSON.parse(cachedPieData));
              setNoDataAvailable(false);
            } else {
              setNoDataAvailable(true);
            }
          } else if (!focusSessions || focusSessions.length === 0) {
            // If no focus sessions yet, use cached data or empty data
            const cachedData = localStorage.getItem('weeklyTrackerData');
            const cachedPieData = localStorage.getItem('weeklyPieData');
            
            if (cachedData && cachedPieData) {
              setData(JSON.parse(cachedData));
              setPieData(JSON.parse(cachedPieData));
              setNoDataAvailable(false);
            } else {
              setNoDataAvailable(true);
            }
          } else {
            // Process the data for charts
            const processedData = processSessionData(focusSessions, startOfWeek);
            setData(processedData.weeklyData);
            setPieData(processedData.pieData);
            
            // Cache the data
            localStorage.setItem('weeklyTrackerData', JSON.stringify(processedData.weeklyData));
            localStorage.setItem('weeklyPieData', JSON.stringify(processedData.pieData));
            
            setNoDataAvailable(false);
          }
        } else {
          // No user logged in, use cached data if available
          const cachedData = localStorage.getItem('weeklyTrackerData');
          const cachedPieData = localStorage.getItem('weeklyPieData');
          
          if (cachedData && cachedPieData) {
            setData(JSON.parse(cachedData));
            setPieData(JSON.parse(cachedPieData));
            setNoDataAvailable(false);
          } else {
            setNoDataAvailable(true);
          }
        }
      } catch (error) {
        console.error('Error in fetchFocusData:', error);
        // Use cached data if available
        const cachedData = localStorage.getItem('weeklyTrackerData');
        const cachedPieData = localStorage.getItem('weeklyPieData');
        
        if (cachedData && cachedPieData) {
          setData(JSON.parse(cachedData));
          setPieData(JSON.parse(cachedPieData));
          setNoDataAvailable(false);
        } else {
          setNoDataAvailable(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFocusData();
  }, [user]);
  
  // Process session data for charts
  const processSessionData = (sessions: any[], startOfWeek: Date) => {
    const daysMap: Record<string, number> = {
      0: 6, // Sunday -> index 6
      1: 0, // Monday -> index 0
      2: 1, // Tuesday -> index 1
      3: 2, // Wednesday -> index 2
      4: 3, // Thursday -> index 3
      5: 4, // Friday -> index 4
      6: 5, // Saturday -> index 5
    };
    
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const subjects = ["Math", "Physics", "History", "English", "Chemistry"];
    
    // Initialize data structures
    const weeklyData = generateEmptyData();
    const subjectTotals: Record<string, number> = {};
    subjects.forEach(subject => subjectTotals[subject] = 0);
    
    // Process each session
    sessions.forEach(session => {
      // Determine which day of the week this session belongs to
      const sessionDate = new Date(session.start_time);
      const dayIndex = daysMap[sessionDate.getDay()];
      
      // If duration is available, use it; otherwise calculate from times
      let duration = session.duration || 0;
      if (!duration && session.end_time) {
        duration = (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60);
      }
      
      // Convert duration from minutes to hours for the chart
      const durationHours = duration / 60;
      weeklyData[dayIndex].total += durationHours;
      
      // Random distribution of time across subjects (since we don't have real subject data)
      // In a real app, you'd have a sessions_subjects table or similar
      let remainingDuration = duration;
      subjects.forEach((subject, index) => {
        if (index === subjects.length - 1) {
          // Last subject gets remaining time
          weeklyData[dayIndex][subject] = remainingDuration / 60;
          subjectTotals[subject] += remainingDuration;
        } else {
          // Random portion of time for each subject
          const subjectMinutes = Math.floor(Math.random() * (remainingDuration / 2)) + 1;
          weeklyData[dayIndex][subject] = subjectMinutes / 60;
          subjectTotals[subject] += subjectMinutes;
          remainingDuration -= subjectMinutes;
        }
      });
    });
    
    // Create pie data
    const pieData = subjects.map(name => ({
      name,
      value: subjectTotals[name]
    }));
    
    return { weeklyData, pieData };
  };
  
  // Calculate total weekly time (in hours)
  const totalWeeklyHours = data.reduce((total, day) => total + day.total, 0);
  
  // Get the user's weekly focus goal or use default
  const weeklyFocusGoal = state.weeklyFocusGoal || 10;
  
  // Calculate daily focus goal (weekly goal divided by 7 days)
  const dailyFocusGoal = weeklyFocusGoal / 7;
  
  // Calculate progress percentage
  const progressPercentage = Math.min(100, (totalWeeklyHours / weeklyFocusGoal) * 100);
  
  // Environment-specific colors
  const getColors = () => {
    switch (state.environment) {
      case 'office':
        return ['#4f46e5', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
      case 'park':
        return ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];
      case 'home':
        return ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];
      case 'coffee-shop':
        return ['#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fcd34d'];
      case 'library':
        return ['#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb'];
      default:
        return ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];
    }
  };

  const colors = getColors();
  
  // Show loading state
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6 flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-triage-purple"></div>
        </CardContent>
      </Card>
    );
  }
  
  // Use empty data for new users with no history
  const chartData = noDataAvailable ? generateEmptyData() : data;
  const chartPieData = noDataAvailable ? generateEmptyPieData() : pieData;
  
  // Mobile optimizations
  const getMobileChartHeight = () => {
    if (!optimizeForMobile) return 300;
    
    switch (chartType) {
      case 'pie': return 250;
      case 'time': return 280;
      default: return 220;
    }
  };
  
  const chartHeight = getMobileChartHeight();
  
  // Create simplified labels for mobile
  const getMobileAxisTickFormatter = (value: string) => {
    if (!optimizeForMobile) return value;
    // Use first letter of day for mobile
    return value.charAt(0);
  };
  
  return (
    <Card className="shadow-sm">
      <CardContent className={`p-${optimizeForMobile ? '2' : '6'}`}>
        {noDataAvailable && (
          <div className="text-center text-gray-500 mb-4 text-sm">
            No focus sessions recorded yet. This chart will populate as you complete sessions.
          </div>
        )}
        
        {chartType === "bar" && (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} margin={optimizeForMobile ? 
              { top: 10, right: 5, left: -20, bottom: 0 } : 
              { top: 20, right: 30, left: 0, bottom: 5 }
            }>
              <CartesianGrid strokeDasharray="3 3" vertical={!optimizeForMobile} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: optimizeForMobile ? 10 : 12 }}
                tickFormatter={getMobileAxisTickFormatter}
              />
              <YAxis 
                unit="hr" 
                tick={{ fontSize: optimizeForMobile ? 10 : 12 }}
                width={optimizeForMobile ? 25 : 30}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)} hr`, "Focus Time"]}
                labelFormatter={(label) => `${label}`}
              />
              {!optimizeForMobile && <Legend />}
              <Bar dataKey="Math" stackId="a" fill={colors[0]} />
              <Bar dataKey="Physics" stackId="a" fill={colors[1]} />
              <Bar dataKey="History" stackId="a" fill={colors[2]} />
              <Bar dataKey="English" stackId="a" fill={colors[3]} />
              <Bar dataKey="Chemistry" stackId="a" fill={colors[4]} />
              {/* Add reference line for daily goal */}
              <ReferenceLine 
                y={dailyFocusGoal} 
                stroke="#ff4081" 
                strokeDasharray="3 3" 
                label={optimizeForMobile ? undefined : "Daily Goal"} 
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === "pie" && (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart margin={optimizeForMobile ? { top: 10, right: 0, left: 0, bottom: 0 } : undefined}>
              <Pie
                data={chartPieData}
                cx="50%"
                cy="50%"
                outerRadius={optimizeForMobile ? 80 : 100}
                innerRadius={optimizeForMobile ? 40 : 60}
                labelLine={!noDataAvailable && !optimizeForMobile}
                label={!noDataAvailable && !optimizeForMobile ? 
                  ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : 
                  false}
                dataKey="value"
              >
                {chartPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${Math.round(value)} min`, "Focus Time"]} />
              <Legend verticalAlign={optimizeForMobile ? "bottom" : "middle"} layout={optimizeForMobile ? "horizontal" : "vertical"} align={optimizeForMobile ? "center" : "right"} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {chartType === "line" && (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart 
              data={chartData} 
              margin={optimizeForMobile ? 
                { top: 10, right: 5, left: -20, bottom: 0 } : 
                { top: 20, right: 30, left: 0, bottom: 5 }
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: optimizeForMobile ? 10 : 12 }}
                tickFormatter={getMobileAxisTickFormatter}
              />
              <YAxis 
                unit="hr" 
                tick={{ fontSize: optimizeForMobile ? 10 : 12 }}
                width={optimizeForMobile ? 25 : 30}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)} hr`, "Focus Time"]}
              />
              <Line type="monotone" dataKey="total" stroke={colors[0]} strokeWidth={2} />
              {/* Update to use dailyFocusGoal */}
              <ReferenceLine 
                y={dailyFocusGoal} 
                stroke="#ff4081" 
                strokeDasharray="3 3" 
                label={optimizeForMobile ? undefined : "Daily Goal"} 
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === "time" && (
          <div className="space-y-4 p-2">
            <div className="flex justify-between">
              <h3 className="text-sm font-medium">Focus Time Distribution</h3>
              <div className="text-sm">
                <span className="font-medium">{totalWeeklyHours.toFixed(1)} hrs</span>
                <span className="text-muted-foreground"> / {weeklyFocusGoal} hrs goal</span>
              </div>
            </div>
            
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all duration-500 ease-in-out"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: progressPercentage >= 100 ? colors[0] : '#8b5cf6'
                }}
              ></div>
            </div>
            
            {["Math", "Physics", "History", "English", "Chemistry"].map((subject, index) => {
              // Calculate total minutes for this subject across the week
              const subjectMinutes = chartData.reduce((total, day) => total + (day[subject] || 0) * 60, 0);
              const percentOfWeek = totalWeeklyHours > 0 ? (subjectMinutes / (totalWeeklyHours * 60)) * 100 : 0;
              
              return (
                <div key={subject} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{subject}</span>
                    <span>{Math.round(subjectMinutes)} min</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percentOfWeek}%`,
                        backgroundColor: colors[index % colors.length]
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyTracker;
