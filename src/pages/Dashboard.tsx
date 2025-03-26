
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
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import EnvironmentDebug from "@/components/EnvironmentDebug";

// Enable this for debugging environment issues
const DEBUG_ENV = true;

const Dashboard = () => {
  const { state, forceEnvironmentSync } = useOnboarding();
  const navigate = useNavigate();
  const { theme, applyEnvironmentTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [preferredChartType, setPreferredChartType] = useState(() => {
    return localStorage.getItem('preferredChartType') || 'bar';
  });
  const isMobile = useIsMobile();
  const { user, refreshUser } = useUser();
  const [syncAttempts, setSyncAttempts] = useState(0);

  // Apply environment theme when component mounts to ensure consistency
  useEffect(() => {
    const syncEnvironment = async () => {
      // First, make sure database is in sync with context
      await forceEnvironmentSync();
      
      // Then apply the environment from the most reliable source in order of precedence
      if (user?.profile?.last_selected_environment) {
        if (DEBUG_ENV) console.log('[Dashboard] Using profile environment (DB truth):', user.profile.last_selected_environment);
        applyEnvironmentTheme(user.profile.last_selected_environment);
        
        // If state.environment doesn't match profile, we have a problem to fix
        if (state.environment && state.environment !== user.profile.last_selected_environment) {
          if (DEBUG_ENV) console.log(`[Dashboard] Environment mismatch detected: state ${state.environment} vs DB ${user.profile.last_selected_environment}`);
          
          // Trigger a user refresh as a fix attempt
          if (syncAttempts < 2) {
            if (DEBUG_ENV) console.log(`[Dashboard] Attempting fix, refreshing user data (attempt ${syncAttempts + 1})`);
            setTimeout(() => {
              refreshUser();
              setSyncAttempts(prev => prev + 1);
            }, 1000);
          }
        }
      } else if (state.environment) {
        if (DEBUG_ENV) console.log('[Dashboard] No profile environment, using onboarding state:', state.environment);
        applyEnvironmentTheme(state.environment);
      } else {
        const localEnv = localStorage.getItem('environment');
        if (DEBUG_ENV) console.log('[Dashboard] Fallback to localStorage environment:', localEnv);
        if (localEnv) {
          applyEnvironmentTheme(localEnv);
        }
      }
      
      // On dashboard mount, check DOM for current environment
      if (DEBUG_ENV) {
        const domEnv = document.documentElement.getAttribute('data-environment');
        const domClasses = document.documentElement.className;
        console.log('[Dashboard] Current DOM environment:', {
          attribute: domEnv,
          classes: domClasses,
          localStorage: localStorage.getItem('environment')
        });
      }
    };
    
    syncEnvironment();
  }, [state.environment, applyEnvironmentTheme, user, forceEnvironmentSync, refreshUser, syncAttempts]);

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

  // Save preferred chart type when it changes
  useEffect(() => {
    localStorage.setItem('preferredChartType', preferredChartType);
  }, [preferredChartType]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setPreferredChartType(value);
  };

  // Get theme variables based on environment
  const getEnvTheme = () => {
    if (!state.environment && user?.profile?.last_selected_environment) {
      return user.profile.last_selected_environment;
    }
    if (!state.environment) return "office";
    return state.environment;
  };

  // Get environment-specific class for card styling with more distinctive colors
  const getEnvCardClass = () => {
    switch (getEnvTheme()) {
      case 'office': return "border-blue-300 bg-gradient-to-br from-blue-50/50 to-white shadow-blue-100/30 shadow-md";
      case 'park': return "border-green-300 bg-gradient-to-br from-green-50/50 to-white shadow-green-100/30 shadow-md";
      case 'home': return "border-orange-300 bg-gradient-to-br from-orange-50/50 to-white shadow-orange-100/30 shadow-md";
      case 'coffee-shop': return "border-amber-300 bg-gradient-to-br from-amber-50/50 to-white shadow-amber-100/30 shadow-md";
      case 'library': return "border-gray-300 bg-gradient-to-br from-gray-50/50 to-white shadow-gray-100/30 shadow-md";
      default: return "border-purple-300 bg-gradient-to-br from-purple-50/50 to-white shadow-purple-100/30 shadow-md";
    }
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
      <TaskList persistToSupabase={true} />
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
            <div data-walkthrough="weekly-tracker" className={`p-4 rounded-lg ${getEnvCardClass()}`}>
              <Tabs defaultValue={preferredChartType} className="w-full" onValueChange={handleTabChange}>
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
                  <WeeklyTracker chartType="bar" optimizeForMobile={isMobile} />
                </TabsContent>
                <TabsContent value="pie" className="mt-0">
                  <WeeklyTracker chartType="pie" optimizeForMobile={isMobile} />
                </TabsContent>
                <TabsContent value="line" className="mt-0">
                  <WeeklyTracker chartType="line" optimizeForMobile={isMobile} />
                </TabsContent>
                <TabsContent value="time" className="mt-0">
                  <WeeklyTracker chartType="time" optimizeForMobile={isMobile} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Display Task List on desktop view */}
            {!isMobile && renderTaskList()}

            <div data-walkthrough="ai-insights" className={`rounded-lg ${getEnvCardClass()}`}>
              <AIInsights />
            </div>
            
            <div className={`rounded-lg ${getEnvCardClass()}`}>
              <Leaderboard />
            </div>

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
      
      {/* Environment debug component */}
      <EnvironmentDebug />
    </div>
  );
};

export default Dashboard;
