
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart3, 
  ChartLine, 
  Lightbulb, 
  AlertCircle, 
  Clock, 
  Trophy, 
  Book, 
  ArrowLeft, 
  Activity,
  Search,
  Brain,
  Mountain
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import CognitiveMetrics from "@/components/reports/CognitiveMetrics";
import FocusBreakdown from "@/components/reports/FocusBreakdown";
import RecommendationsCard from "@/components/reports/RecommendationsCard";
import ErrorBoundary from "@/components/ErrorBoundary";
import TerrainMapping from "@/components/reports/terrain/TerrainMapping";

const Reports = () => {
  const { state } = useOnboarding();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("cognitive");

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground pb-20",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="py-6 flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Learning Reports</h1>
            <p className="text-muted-foreground">View your learning progress and insights</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Learning Progress
                </CardTitle>
                <CardDescription>
                  Your learning progress and activity overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <div className="relative h-[400px] rounded-md overflow-hidden border">
                    <ErrorBoundary fallback={<div className="flex items-center justify-center h-full">Error loading visualization</div>}>
                      <TerrainMapping />
                    </ErrorBoundary>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <RecommendationsCard />
          </div>
        </div>

        <Tabs defaultValue="cognitive" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="cognitive" className="flex items-center gap-1">
              <Book className="h-4 w-4" /> Learning Analysis
            </TabsTrigger>
            <TabsTrigger value="focus" className="flex items-center gap-1">
              <Activity className="h-4 w-4" /> Focus Metrics
            </TabsTrigger>
            <TabsTrigger value="terrain" className="flex items-center gap-1">
              <Mountain className="h-4 w-4" /> Terrain Explorer
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cognitive" className="space-y-4">
            <CognitiveMetrics />
          </TabsContent>
          
          <TabsContent value="focus" className="space-y-4">
            <FocusBreakdown />
          </TabsContent>
          
          <TabsContent value="terrain" className="space-y-4">
            <Card className="shadow-sm mb-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Mountain className="h-5 w-5 mr-2 text-primary" />
                  Advanced Terrain Explorer
                </CardTitle>
                <CardDescription>
                  Interactive 3D visualization of learning terrain and pathways
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px]">
                  <TerrainMapping />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <NavigationBar />
    </div>
  );
};

export default Reports;
