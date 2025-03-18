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
    total: 0
  }));
};

// Generate empty data for the pie chart
const generateEmptyPieData = () => {
  return [];
};

const WeeklyTracker = ({ chartType, hasData = true, optimizeForMobile = false }: WeeklyTrackerProps) => {
  const { state } = useOnboarding();
  const { user } = useUser();
  const [data, setData] = useState(generateEmptyData());
  const [pieData, setPieData] = useState(generateEmptyPieData());
  const [subjectColors, setSubjectColors] = useState<{[key: string]: string}>({});
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
            .select('*, tasks!focus_sessions_id_fkey(*)')
            .eq('user_id', user.id)
            .gte('start_time', startOfWeek.toISOString())
            .lte('start_time', endOfWeek.toISOString());
            
          if (error) {
            console.error('Error fetching focus sessions:', error);
            setNoDataAvailable(true);
          } else if (!focusSessions || focusSessions.length === 0) {
            setNoDataAvailable(true);
          } else {
            // Get user tasks to extract unique categories/subjects
            const { data: userTasks, error: tasksError } = await supabase
              .from('tasks')
              .select('title, description, priority')
              .eq('user_id', user.id);
              
            if (tasksError) {
              console.error('Error fetching user tasks:', tasksError);
            }
            
            // Extract subjects/categories from tasks
            const subjects = new Set<string>();
            userTasks?.forEach(task => {
              // Add priority as a category
              if (task.priority) {
                subjects.add(task.priority.charAt(0).toUpperCase() + task.priority.slice(1));
              }
              
              // Try to extract subjects from description with #tags
              if (task.description) {
                const tags = task.description.match(/#(\w+)/g);
                if (tags) {
                  tags.forEach(tag => {
                    subjects.add(tag.substring(1).charAt(0).toUpperCase() + tag.substring(1).slice(1));
                  });
                }
              }
            });
            
            // If no subjects found, use some defaults
            if (subjects.size === 0) {
              ['Study', 'Work', 'Personal', 'Other'].forEach(subject => subjects.add(subject));
            }
            
            // Process the data for charts
            const processedData = processSessionData(focusSessions, startOfWeek, Array.from(subjects));
            setData(processedData.weeklyData);
            setPieData(processedData.pieData);
            setSubjectColors(processedData.subjectColors);
            setNoDataAvailable(false);
          }
        } else {
          setNoDataAvailable(true);
        }
      } catch (error) {
        console.error('Error in fetchFocusData:', error);
        setNoDataAvailable(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFocusData();
  }, [user]);
  
  // Process session data for charts
  const processSessionData = (sessions: any[], startOfWeek: Date, subjects: string[]) => {
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
    
    // Initialize data structures
    const weeklyData = days.map(day => {
      const dayObj: {[key: string]: any} = { day, total: 0 };
      subjects.forEach(subject => {
        dayObj[subject] = 0;
      });
      return dayObj;
    });
    
    const subjectTotals: Record<string, number> = {};
    subjects.forEach(subject => subjectTotals[subject] = 0);
    
    // Create colors for each subject
    const colors = getColors();
    const subjectColors: {[key: string]: string} = {};
    subjects.forEach((subject, index) => {
      subjectColors[subject] = colors[index % colors.length];
    });
    
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
      
      // If session has associated tasks, distribute time based on tasks
      if (session.tasks && session.tasks.length > 0) {
        const tasksWithSubjects = session.tasks.map((task: any) => {
          // Try to determine subject from task
          let taskSubject = 'Other';
          
          // Check priority first
          if (task.priority) {
            taskSubject = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
          }
          
          // Then check for #tags in description
          if (task.description) {
            const tags = task.description.match(/#(\w+)/g);
            if (tags && tags.length > 0) {
              taskSubject = tags[0].substring(1).charAt(0).toUpperCase() + tags[0].substring(1).slice(1);
            }
          }
          
          return {
            ...task,
            subject: taskSubject
          };
        });
        
        // Distribute session time across task subjects
        const timePerTask = durationHours / tasksWithSubjects.length;
        
        tasksWithSubjects.forEach((task: any) => {
          if (subjects.includes(task.subject)) {
            weeklyData[dayIndex][task.subject] += timePerTask;
            subjectTotals[task.subject] += timePerTask * 60; // Store in minutes for pie chart
          } else {
            weeklyData[dayIndex]['Other'] = (weeklyData[dayIndex]['Other'] || 0) + timePerTask;
            subjectTotals['Other'] = (subjectTotals['Other'] || 0) + timePerTask * 60;
          }
        });
      } else {
        // If no tasks associated, assign to "Other"
        weeklyData[dayIndex]['Other'] = (weeklyData[dayIndex]['Other'] || 0) + durationHours;
        subjectTotals['Other'] = (subjectTotals['Other'] || 0) + durationHours * 60;
      }
    });
    
    // Create pie data
    const pieData = Object.entries(subjectTotals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value
      }));
    
    return { weeklyData, pieData, subjectColors };
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
  
  // Get unique subjects from data
  const getSubjects = () => {
    if (chartData.length === 0) return [];
    
    const firstDay = chartData[0];
    return Object.keys(firstDay).filter(key => key !== 'day' && key !== 'total');
  };
  
  const subjects = getSubjects();
  
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
              
              {subjects.map((subject, index) => (
                <Bar 
                  key={subject} 
                  dataKey={subject} 
                  stackId="a" 
                  fill={subjectColors[subject] || colors[index % colors.length]} 
                />
              ))}
              
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
                  <Cell 
                    key={`cell-${index}`} 
                    fill={subjectColors[entry.name] || colors[index % colors.length]} 
                  />
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
            
            {chartPieData.map((subject, index) => {
              const percentOfWeek = totalWeeklyHours > 0 ? (subject.value / (totalWeeklyHours * 60)) * 100 : 0;
              
              return (
                <div key={subject.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{subject.name}</span>
                    <span>{Math.round(subject.value)} min</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percentOfWeek}%`,
                        backgroundColor: subjectColors[subject.name] || colors[index % colors.length]
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

