
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

const FocusBreakdown = () => {
  // Mock data for the charts
  const focusDistribution = [
    { name: "Deep Focus", value: 12, color: "#8884d8" },
    { name: "Active Learning", value: 8, color: "#82ca9d" },
    { name: "Review & Practice", value: 6, color: "#ffc658" },
    { name: "Research & Reading", value: 5, color: "#ff8042" },
  ];

  const focusTrends = [
    { week: "Week 1", hours: 18 },
    { week: "Week 2", hours: 22 },
    { week: "Week 3", hours: 20 },
    { week: "Week 4", hours: 25 },
    { week: "Week 5", hours: 28 },
    { week: "Week 6", hours: 24 },
    { week: "Week 7", hours: 31 },
    { week: "Week 8", hours: 35 },
  ];

  const timeOfDay = [
    { time: "Early Morning (5-8 AM)", score: 65 },
    { time: "Morning (8-11 AM)", score: 85 },
    { time: "Midday (11 AM-2 PM)", score: 60 },
    { time: "Afternoon (2-5 PM)", score: 70 },
    { time: "Evening (5-8 PM)", score: 75 },
    { time: "Night (8-11 PM)", score: 50 },
    { time: "Late Night (11 PM-5 AM)", score: 40 },
  ];

  // Calculate total focus hours
  const totalHours = focusDistribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Focus Hours</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-5xl font-bold text-primary">{totalHours}</span>
              <span className="text-sm text-muted-foreground mt-1">hours this month</span>
              <span className="text-sm font-medium mt-4 text-green-600">+18% vs. last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Session</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-5xl font-bold text-primary">42</span>
              <span className="text-sm text-muted-foreground mt-1">minutes per session</span>
              <span className="text-sm font-medium mt-4 text-green-600">+7 min vs. last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Focus Score</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-5xl font-bold text-primary">83</span>
              <span className="text-sm text-muted-foreground mt-1">overall focus quality</span>
              <span className="text-sm font-medium mt-4 text-green-600">+5 pts vs. last month</span>
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
                    label={({ name, value }) => `${name}: ${value}h`}
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
                    label={{ position: 'right', formatter: (value: number) => `${value}%` }}
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
