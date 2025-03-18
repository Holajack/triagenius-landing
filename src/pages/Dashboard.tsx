import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WeeklyTracker from "@/components/dashboard/WeeklyTracker";
import QuickStartButton from "@/components/dashboard/QuickStartButton";
import AIInsights from "@/components/dashboard/AIInsights";
import Leaderboard from "@/components/dashboard/Leaderboard";
import MotivationalTip from "@/components/dashboard/MotivationalTip";
import NavigationBar from "@/components/dashboard/NavigationBar";
import TaskList from "@/components/tasks/TaskList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChartIcon, BarChart4, LineChart, Clock } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import DashboardWalkthrough from "@/components/walkthrough/DashboardWalkthrough";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const { state } = useOnboarding();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  // Modified redirection logic to only redirect if explicitly coming from the index page
  useEffect(() => {
    if (!state.isComplete && !state.environment && window.location.pathname === "/") {
      navigate("/onboarding");
    } else {
      // Simulate data loading
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [state, navigate]);

  // Get theme variables based on environment
  const getEnvTheme = () => {
    if (!state.environment) return "office";
    return state.environment;
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-triage-purple"></div>
      </div>
    );
  }

  const renderTaskList = () => (
    <div className="mb-6">
      <TaskList />
    </div>
  );

  return (
    <div className={`min-h-screen bg-background text-foreground theme-${getEnvTheme()} ${theme}`}>
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div data-walkthrough="dashboard-header">
          <DashboardHeader />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left column - Weekly tracker */}
          <div className="md:col-span-2 space-y-4">
            <div data-walkthrough="weekly-tracker">
              <Tabs defaultValue="bar" className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Weekly Progress</h2>
                  <TabsList className="grid grid-cols-4 w-52">
                    <TabsTrigger value="bar">
                      <BarChart4 className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="pie">
                      <PieChartIcon className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="line">
                      <LineChart className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="time">
                      <Clock className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="bar" className="mt-0">
                  <WeeklyTracker chartType="bar" />
                </TabsContent>
                <TabsContent value="pie" className="mt-0">
                  <WeeklyTracker chartType="pie" />
                </TabsContent>
                <TabsContent value="line" className="mt-0">
                  <WeeklyTracker chartType="line" />
                </TabsContent>
                <TabsContent value="time" className="mt-0">
                  <WeeklyTracker chartType="time" />
                </TabsContent>
              </Tabs>
            </div>

            {/* Display Task List on desktop view */}
            {!isMobile && renderTaskList()}

            <div data-walkthrough="ai-insights">
              <AIInsights />
            </div>
            <Leaderboard />

            {/* Display Task List on mobile below Leaderboard */}
            {isMobile && renderTaskList()}
          </div>

          {/* Right column - Quick actions & tips */}
          <div className="space-y-4">
            <div data-walkthrough="quick-start">
              <QuickStartButton />
            </div>
            <MotivationalTip />
          </div>
        </div>
      </div>

      <div data-walkthrough="navigation-bar">
        <NavigationBar />
      </div>

      {/* Walkthrough component */}
      <DashboardWalkthrough />
    </div>
  );
};

export default Dashboard;
