
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
  Brain
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import CognitiveMetrics from "@/components/reports/CognitiveMetrics";
import FocusBreakdown from "@/components/reports/FocusBreakdown";
import RecommendationsCard from "@/components/reports/RecommendationsCard";
import ErrorBoundary from "@/components/ErrorBoundary";

const Reports = () => {
  const { state } = useOnboarding();
  const navigate = useNavigate();
  const { theme } = useTheme();

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
                  <div className="relative h-[400px] bg-black/5 rounded-md overflow-hidden border border-gray-200">
                    <ErrorBoundary fallback={<div className="flex items-center justify-center h-full">Error loading visualization</div>}>
                      <div className="flex items-center justify-center h-full bg-gray-50">
                        <div className="text-center p-6">
                          <Brain className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
                          <h3 className="font-medium text-lg mb-2">Learning Pathways Visualization</h3>
                          <p className="text-muted-foreground mb-4">View your cognitive learning pathways and brain region activity</p>
                          <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                            {[
                              { name: "Prefrontal", color: "bg-red-500" },
                              { name: "Hippocampus", color: "bg-blue-500" },
                              { name: "Amygdala", color: "bg-green-500" },
                              { name: "Cerebellum", color: "bg-yellow-500" },
                              { name: "Parietal", color: "bg-purple-500" }
                            ].map((region, i) => (
                              <div key={i} className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${region.color} mb-1`}></div>
                                <span className="text-xs">{region.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
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

        <Tabs defaultValue="cognitive" className="space-y-4">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="cognitive" className="flex items-center gap-1">
              <Book className="h-4 w-4" /> Learning Analysis
            </TabsTrigger>
            <TabsTrigger value="focus" className="flex items-center gap-1">
              <Activity className="h-4 w-4" /> Focus Metrics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cognitive" className="space-y-4">
            <CognitiveMetrics />
          </TabsContent>
          
          <TabsContent value="focus" className="space-y-4">
            <FocusBreakdown />
          </TabsContent>
        </Tabs>
      </div>
      
      <NavigationBar />
    </div>
  );
};

export default Reports;
