
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
} from "recharts";

type ChartType = "bar" | "pie" | "line" | "time";

// Mock data for the weekly tracker
const generateMockData = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const subjects = ["Math", "Physics", "History", "English", "Chemistry"];
  
  return days.map(day => {
    const totalTime = Math.floor(Math.random() * 5) + 1;
    const subjectData: Record<string, number> = {};
    
    subjects.forEach(subject => {
      subjectData[subject] = Math.floor(Math.random() * 120) + 10;
    });
    
    return {
      day,
      total: totalTime,
      ...subjectData,
    };
  });
};

// Mock data for the pie chart
const generatePieData = () => {
  const subjects = ["Math", "Physics", "History", "English", "Chemistry"];
  
  return subjects.map(name => ({
    name,
    value: Math.floor(Math.random() * 600) + 100,
  }));
};

const WeeklyTracker = ({ chartType }: { chartType: ChartType }) => {
  const { state } = useOnboarding();
  const [data, setData] = useState(() => generateMockData());
  const [pieData, setPieData] = useState(() => generatePieData());
  
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
  
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        {chartType === "bar" && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis unit="h" />
              <Tooltip
                formatter={(value: number) => [`${value} min`, "Focus Time"]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="Math" stackId="a" fill={colors[0]} />
              <Bar dataKey="Physics" stackId="a" fill={colors[1]} />
              <Bar dataKey="History" stackId="a" fill={colors[2]} />
              <Bar dataKey="English" stackId="a" fill={colors[3]} />
              <Bar dataKey="Chemistry" stackId="a" fill={colors[4]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === "pie" && (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                labelLine={true}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} min`, "Focus Time"]} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {chartType === "line" && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis unit="h" />
              <Tooltip
                formatter={(value: number) => [`${value} hr`, "Focus Time"]}
              />
              <Line type="monotone" dataKey="total" stroke={colors[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === "time" && (
          <div className="space-y-4 p-4">
            <div className="flex justify-between">
              <h3 className="text-sm font-medium">Focus Time Distribution</h3>
              <p className="text-sm font-medium">14.5 hrs total</p>
            </div>
            
            {["Math", "Physics", "History", "English", "Chemistry"].map((subject, index) => (
              <div key={subject} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{subject}</span>
                  <span>{Math.floor(Math.random() * 300) + 30} min</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.floor(Math.random() * 100) + 10}%`,
                      backgroundColor: colors[index % colors.length]
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyTracker;
