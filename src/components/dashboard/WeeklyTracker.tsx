
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { BarChart2, Clock, ListChecks, Zap, CheckCircle2 } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useTasks } from "@/contexts/TaskContext";
import { PriorityLevel } from "@/types/tasks";

// Define the COLORS array for chart visualizations
const COLORS = ['#9b87f5', '#7E69AB', '#6E59A5', '#D6BCFA', '#E5DEFF'];

interface WeeklyTrackerProps {
  chartType: string;
  optimizeForMobile: boolean;
}

const WeeklyTracker: React.FC<WeeklyTrackerProps> = ({ chartType, optimizeForMobile }) => {
  const { state } = useOnboarding();
  const [activeTab, setActiveTab] = useState("focus-time");
  const { user } = useUser();
  const { state: taskState } = useTasks();
  
  const [focusTimeData, setFocusTimeData] = useState<{ day: string; total: number; }[]>([
    { day: "Mon", total: 0 },
    { day: "Tue", total: 0 },
    { day: "Wed", total: 0 },
    { day: "Thu", total: 0 },
    { day: "Fri", total: 0 },
    { day: "Sat", total: 0 },
    { day: "Sun", total: 0 },
  ]);
  
  const [taskData, setTaskData] = useState<{ day: string; total: number; }[]>([
    { day: "Mon", total: 0 },
    { day: "Tue", total: 0 },
    { day: "Wed", total: 0 },
    { day: "Thu", total: 0 },
    { day: "Fri", total: 0 },
    { day: "Sat", total: 0 },
    { day: "Sun", total: 0 },
  ]);
  
  const [subjectData, setSubjectData] = useState<{ name: string; value: number; }[]>([]);
  const [taskStatusData, setTaskStatusData] = useState<{ name: string; value: number; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const getDayOfWeek = (dateString: string): string => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const date = new Date(dateString);
    return days[date.getDay()];
  };
  
  const getWeekBounds = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return { startOfWeek, endOfWeek };
  };
  
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      
      try {
        const { startOfWeek, endOfWeek } = getWeekBounds();
        
        const { data: focusData, error: focusError } = await supabase
          .from('focus_sessions')
          .select('start_time, duration, created_at')
          .eq('user_id', user.id)
          .gte('created_at', startOfWeek.toISOString())
          .lt('created_at', endOfWeek.toISOString());
          
        if (focusError) {
          console.error('Error fetching focus data:', focusError);
        } else {
          const weeklyFocusData = {
            "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0
          };
          
          focusData?.forEach(session => {
            const day = getDayOfWeek(session.created_at || session.start_time);
            const durationHours = (session.duration || 0) / 60;
            weeklyFocusData[day as keyof typeof weeklyFocusData] += durationHours;
          });
          
          const formattedFocusData = Object.entries(weeklyFocusData).map(([day, total]) => ({
            day,
            total: parseFloat(total.toFixed(1))
          }));
          
          setFocusTimeData(formattedFocusData);
        }
        
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, status, priority, created_at')
          .eq('user_id', user.id)
          .gte('created_at', startOfWeek.toISOString())
          .lt('created_at', endOfWeek.toISOString());
          
        if (tasksError) {
          console.error('Error fetching tasks data:', tasksError);
        } else if (tasksData) {
          const weeklyTaskData = {
            "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0
          };
          
          tasksData.forEach(task => {
            if (task.status === 'completed') {
              const day = getDayOfWeek(task.created_at);
              weeklyTaskData[day as keyof typeof weeklyTaskData] += 1;
            }
          });
          
          const formattedTaskData = Object.entries(weeklyTaskData).map(([day, total]) => ({
            day,
            total
          }));
          
          setTaskData(formattedTaskData);
          
          const taskStatusCounts = {
            "Completed": 0,
            "In Progress": 0,
            "Pending": 0
          };
          
          tasksData.forEach(task => {
            if (task.status === 'completed') taskStatusCounts["Completed"]++;
            else if (task.status === 'in_progress') taskStatusCounts["In Progress"]++;
            else taskStatusCounts["Pending"]++;
          });
          
          const formattedTaskStatusData = Object.entries(taskStatusCounts).map(([name, value]) => ({
            name,
            value
          }));
          
          setTaskStatusData(formattedTaskStatusData);
          
          const titleCounts: Record<string, number> = {};
          
          tasksData.forEach(task => {
            const subject = task.title || 'Untitled';
            titleCounts[subject] = (titleCounts[subject] || 0) + 1;
          });
          
          const formattedSubjectData = Object.entries(titleCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
          
          setSubjectData(formattedSubjectData);
        }
      } catch (error) {
        console.error('Error loading weekly tracker data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    const channel = supabase
      .channel('weekly-tracker-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'focus_sessions' }, 
        () => loadData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => loadData()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  
  const getChartColor = () => {
    switch (state.environment) {
      case 'office': return "#3b82f6";
      case 'park': return "#22c55e";
      case 'home': return "#f97316";
      case 'coffee-shop': return "#f59e0b";
      case 'library': return "#6b7280";
      default: return "#8b5cf6";
    }
  };
  
  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#8884d8';
    }
  };
  
  const formatTooltip = (value: number, name: string) => {
    return [`${value} ${activeTab === "focus-time" ? "hrs" : "tasks"}`, name];
  };
  
  const renderChart = () => {
    const data = activeTab === "focus-time" ? focusTimeData : taskData;
    
    switch (chartType) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
                nameKey="day"
                label={(entry) => entry.day}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltip} />
            </PieChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip formatter={formatTooltip} />
              <Line
                type="monotone"
                dataKey="total"
                stroke={getChartColor()}
                strokeWidth={2}
                dot={{ r: 4, fill: getChartColor() }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "time":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              barGap={8}
              barSize={optimizeForMobile ? 15 : 20}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                fontSize={optimizeForMobile ? 10 : 12}
                interval={0}
              />
              <Tooltip
                cursor={false}
                formatter={formatTooltip}
              />
              <Bar
                dataKey="total"
                fill={getChartColor()}
                radius={[4, 4, 0, 0]}
                name={activeTab === "focus-time" ? "Focus Hours" : "Completed Tasks"}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case "bar":
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              barGap={8}
              barSize={optimizeForMobile ? 15 : 20}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                fontSize={optimizeForMobile ? 10 : 12}
                interval={0}
              />
              <Tooltip
                cursor={false}
                formatter={formatTooltip}
              />
              <Bar
                dataKey="total"
                fill={getChartColor()}
                radius={[4, 4, 0, 0]}
                name={activeTab === "focus-time" ? "Focus Hours" : "Completed Tasks"}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };
  
  if (isLoading) {
    return (
      <Card className="col-span-12 lg:col-span-7">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-triage-purple" />
            Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-36 mb-4"></div>
            <div className="h-32 bg-muted/50 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="col-span-12 lg:col-span-7">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-triage-purple" />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="focus-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Focus Time</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <span>Tasks</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="focus-time" className="h-[200px]">
            {renderChart()}
          </TabsContent>
          
          <TabsContent value="tasks" className="h-[200px]">
            {renderChart()}
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-triage-purple" />
            <p className="text-sm font-medium">
              {activeTab === "focus-time" ? "Subject Distribution" : "Your Tasks"}
            </p>
          </div>
          
          {activeTab === "focus-time" ? (
            <div className="space-y-2">
              {subjectData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-20 text-xs truncate">{item.name}</span>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (item.value / 10) * 100)}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    ></div>
                  </div>
                  <span className="text-xs">{item.value}</span>
                </div>
              ))}
              
              {subjectData.length === 0 && (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  No data available. Start creating subjects to see your progress!
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {taskState.tasks.length > 0 ? (
                taskState.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 py-1 border-b border-gray-100 last:border-0">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    ></div>
                    <span className="text-xs truncate flex-1 max-w-[80%]">
                      {task.title}
                    </span>
                    <div className="flex items-center ml-auto">
                      {task.completed ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {task.subtasks.length > 0 ? 
                            `${task.subtasks.filter(st => st.completed).length}/${task.subtasks.length}` : 
                            "pending"}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  No tasks available. Add tasks in the task list below!
                </div>
              )}
            </div>
          )}
          
          {activeTab === "tasks" && taskState.tasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total: {taskState.tasks.length} tasks</span>
                <span>Completed: {taskState.tasks.filter(t => t.completed).length}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyTracker;
