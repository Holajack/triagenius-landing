
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  BarChart3, 
  ChartLine, 
  Lightbulb, 
  AlertCircle, 
  Clock, 
  Trophy, 
  Book, 
  ArrowLeft, 
  Activity,
  ZoomIn,
  ZoomOut,
  RotateCw
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import BrainModel from "@/components/reports/BrainModel";
import CognitiveMetrics from "@/components/reports/CognitiveMetrics";
import FocusBreakdown from "@/components/reports/FocusBreakdown";
import RecommendationsCard from "@/components/reports/RecommendationsCard";

const Reports = () => {
  const { state } = useOnboarding();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const increaseZoom = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  const decreaseZoom = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const rotateModel = () => setRotation(prev => (prev + 15) % 360);

  const regionDescriptions = {
    "Frontal Lobe": "Critical thinking & problem solving. Active during math and coding tasks.",
    "Temporal Lobe": "Memory retention & language processing. Active during language learning & memorization.",
    "Parietal Lobe": "Sensory processing & spatial awareness. Active during visualization exercises.",
    "Occipital Lobe": "Visual processing. Active during reading & visual learning.",
    "Cerebellum": "Coordination & procedural memory. Active during repetitive practice."
  };

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
            <h1 className="text-2xl font-bold">Cognitive Reports</h1>
            <p className="text-muted-foreground">Track your brain activity and learning progress</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-primary" />
                  Neural Activity Visualization
                </CardTitle>
                <CardDescription>
                  Explore how different study activities engage various brain regions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <div className="flex justify-end gap-2 mb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={decreaseZoom}
                      className="h-8 w-8 p-0"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={increaseZoom}
                      className="h-8 w-8 p-0"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={rotateModel}
                      className="h-8 w-8 p-0"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="relative h-[400px] bg-black/5 rounded-md overflow-hidden">
                    <BrainModel 
                      activeRegion={activeRegion} 
                      setActiveRegion={setActiveRegion}
                      zoomLevel={zoomLevel}
                      rotation={rotation}
                    />
                    
                    {activeRegion && (
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-3 border-t">
                        <h4 className="font-medium">{activeRegion} Region</h4>
                        <p className="text-xs text-muted-foreground">
                          {activeRegion in regionDescriptions ? 
                            regionDescriptions[activeRegion as keyof typeof regionDescriptions] : 
                            "Information about this region is not available."}
                        </p>
                      </div>
                    )}
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
              <Brain className="h-4 w-4" /> Cognitive Analysis
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
