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

const DEBUG_ENV = true;

const Dashboard = () => {
  const {
    state,
    forceEnvironmentSync,
    isLoading: onboardingLoading
  } = useOnboarding();
  
  const navigate = useNavigate();
  const { theme, applyEnvironmentTheme, environmentTheme, verifyEnvironmentWithDatabase } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [preferredChartType, setPreferredChartType] = useState(() => {
    return localStorage.getItem('preferredChartType') || 'bar';
  });
  const isMobile = useIsMobile();
  const { user, refreshUser } = useUser();
  const [syncAttempts, setSyncAttempts] = useState(0);
  const [environmentSynced, setEnvironmentSynced] = useState(false);

  useEffect(() => {
    const syncEnvironment = async () => {
      if (onboardingLoading) {
        return; // Wait until onboarding context is loaded
      }

      if (DEBUG_ENV) console.log('[Dashboard] Starting environment sync on mount');
      
      if (user?.id) {
        try {
          // First get the latest profile environment - this is our source of truth
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('last_selected_environment')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            console.error('[Dashboard] Error fetching profile environment:', profileError);
          } else if (profileData?.last_selected_environment) {
            const dbEnvironment = profileData.last_selected_environment;
            
            if (DEBUG_ENV) {
              console.log('[Dashboard] DB environment from profiles table:', dbEnvironment);
              console.log('[Dashboard] Current state:', {
                contextEnv: state.environment,
                themeEnv: environmentTheme,
                localStorageEnv: localStorage.getItem('environment'),
                domEnv: document.documentElement.getAttribute('data-environment')
              });
            }
            
            // If any of the environments are out of sync, update all of them
            if (
              dbEnvironment !== state.environment || 
              dbEnvironment !== environmentTheme ||
              dbEnvironment !== localStorage.getItem('environment') ||
              dbEnvironment !== document.documentElement.getAttribute('data-environment')
            ) {
              if (DEBUG_ENV) console.log(`[Dashboard] Applying DB environment: ${dbEnvironment}`);
              
              // Update localStorage
              localStorage.setItem('environment', dbEnvironment);
              
              // Update DOM
              document.documentElement.classList.remove(
                'theme-office', 
                'theme-park', 
                'theme-home', 
                'theme-coffee-shop', 
                'theme-library'
              );
              document.documentElement.classList.add(`theme-${dbEnvironment}`);
              document.documentElement.setAttribute('data-environment', dbEnvironment);
              
              // Update theme context
              applyEnvironmentTheme(dbEnvironment);
              
              // Update onboarding context
              await forceEnvironmentSync();
              
              // Also update onboarding_preferences for consistency
              const { error: prefError } = await supabase
                .from('onboarding_preferences')
                .update({ learning_environment: dbEnvironment })
                .eq('user_id', user.id);
                
              if (prefError) {
                console.error('[Dashboard] Error updating onboarding preferences:', prefError);
              } else if (DEBUG_ENV) {
                console.log('[Dashboard] Successfully updated onboarding_preferences to:', dbEnvironment);
              }
              
              // Refresh user to get latest profile data
              setTimeout(() => refreshUser(), 500);
            } else {
              if (DEBUG_ENV) console.log('[Dashboard] Environment already in sync with DB');
            }
            
            setEnvironmentSynced(true);
          }
        } catch (err) {
          console.error('[Dashboard] Error in syncEnvironment:', err);
        }
      }
    };
    
    syncEnvironment();
    
    const verifyTimer = setTimeout(async () => {
      if (user?.id && !environmentSynced) {
        if (DEBUG_ENV) console.log('[Dashboard] Running secondary environment verification');
        await verifyEnvironmentWithDatabase(user.id);
      }
    }, 1500);
    
    return () => clearTimeout(verifyTimer);
  }, [user?.id, applyEnvironmentTheme, forceEnvironmentSync, refreshUser, state.environment, environmentTheme, onboardingLoading, verifyEnvironmentWithDatabase, environmentSynced]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'environment' && e.newValue !== environmentTheme) {
        if (DEBUG_ENV) console.log(`[Dashboard] Environment changed in storage to: ${e.newValue}`);
        refreshUser();
        forceEnvironmentSync();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [environmentTheme, refreshUser, forceEnvironmentSync]);

  useEffect(() => {
    if (!state.isComplete && !state.environment && window.location.pathname === "/") {
      navigate("/onboarding");
    } else {
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [state, navigate]);

  useEffect(() => {
    localStorage.setItem('preferredChartType', preferredChartType);
  }, [preferredChartType]);

  const handleTabChange = (value: string) => {
    setPreferredChartType(value);
  };

  const getEnvTheme = () => {
    if (!state.environment && user?.profile?.last_selected_environment) {
      return user.profile.last_selected_environment;
    }
    if (!state.environment) return "office";
    return state.environment;
  };

  const getEnvCardClass = () => {
    switch (getEnvTheme()) {
      case 'office': return "border-blue-300 bg-gradient-to-br from-blue-50/80 to-white shadow-blue-100/40 shadow-md";
      case 'park': return "border-green-500 bg-gradient-to-br from-green-50/80 to-white shadow-green-100/40 shadow-md";
      case 'home': return "border-orange-300 bg-gradient-to-br from-orange-50/80 to-white shadow-orange-100/40 shadow-md";
      case 'coffee-shop': return "border-amber-500 bg-gradient-to-br from-amber-50/80 to-white shadow-amber-100/40 shadow-md";
      case 'library': return "border-gray-300 bg-gradient-to-br from-gray-50/80 to-white shadow-gray-100/40 shadow-md";
      default: return "border-purple-300 bg-gradient-to-br from-purple-50/80 to-white shadow-purple-100/40 shadow-md";
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

            {!isMobile && renderTaskList()}

            <div data-walkthrough="ai-insights" className={`rounded-lg ${getEnvCardClass()}`}>
              <AIInsights />
            </div>
            
            <div className={`rounded-lg ${getEnvCardClass()}`}>
              <Leaderboard />
            </div>

            {isMobile && renderTaskList()}
          </div>

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

      <DashboardWalkthrough />
      
      <EnvironmentDebug />
    </div>
  );
};

export default Dashboard;
