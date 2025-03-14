
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Brain, Book, PencilLine, Headphones, Eye, Hand, Lightbulb, BadgePercent } from "lucide-react";
import NavigationBar from "@/components/dashboard/NavigationBar";

const Bonuses = () => {
  const [activeTab, setActiveTab] = useState("quiz");
  
  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <h1 className="text-3xl font-bold mb-6 mt-2">Learning Bonuses</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <BadgePercent className="w-4 h-4" />
            <span>How You Learn Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="brain" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span>Brain Mapping</span>
          </TabsTrigger>
        </TabsList>
        
        {/* How You Learn Quiz */}
        <TabsContent value="quiz">
          <Card>
            <CardHeader>
              <CardTitle>Discover Your Learning Style</CardTitle>
              <CardDescription>
                Complete this AI-powered assessment to identify your optimal learning methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                {/* Learning Style Cards */}
                <LearningStyleCard 
                  title="Auditory" 
                  description="Learn by listening and speaking" 
                  icon={<Headphones className="h-6 w-6" />} 
                  color="bg-blue-100 dark:bg-blue-900"
                />
                
                <LearningStyleCard 
                  title="Visual" 
                  description="Learn through images and spatial understanding" 
                  icon={<Eye className="h-6 w-6" />} 
                  color="bg-green-100 dark:bg-green-900"
                />
                
                <LearningStyleCard 
                  title="Physical" 
                  description="Learn by doing and interacting" 
                  icon={<Hand className="h-6 w-6" />} 
                  color="bg-amber-100 dark:bg-amber-900"
                />
                
                <LearningStyleCard 
                  title="Logical" 
                  description="Learn through reasoning and systems" 
                  icon={<Lightbulb className="h-6 w-6" />} 
                  color="bg-purple-100 dark:bg-purple-900"
                />
                
                <LearningStyleCard 
                  title="Vocal" 
                  description="Learn by speaking and explaining concepts" 
                  icon={<PencilLine className="h-6 w-6" />} 
                  color="bg-rose-100 dark:bg-rose-900"
                />
              </div>
              
              <div className="mt-8 text-center">
                <Button size="lg" className="gap-2">
                  <Book className="h-4 w-4" />
                  <span>Start The Quiz</span>
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Takes approximately 15 minutes to complete
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Brain Mapping */}
        <TabsContent value="brain">
          <Card>
            <CardHeader>
              <CardTitle>Brain Mapping for Study Subjects</CardTitle>
              <CardDescription>
                Explore how different subjects engage various regions of your brain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="h-[400px] rounded-lg overflow-hidden border bg-background flex items-center justify-center">
                  <div className="text-center p-6">
                    <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="font-medium text-xl mb-2">Brain Region Mapping</h3>
                    <p className="text-muted-foreground">Visualize how different subjects affect brain activity</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Brain Learning Regions
                  </h3>
                  
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Each region of the brain specializes in processing different types of information.
                      Understanding these specializations can help you optimize your learning approach.
                    </p>
                    
                    <h4 className="font-medium mt-4">Key Brain Regions for Learning:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Frontal Lobe: Planning & Decision-Making</li>
                      <li>Temporal Lobe: Memory Formation</li>
                      <li>Limbic System: Emotional Learning</li>
                      <li>Cerebellum: Skill Mastery</li>
                      <li>Parietal Lobe: Problem Solving</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <NavigationBar />
    </div>
  );
};

// Learning Style Card Component
const LearningStyleCard = ({ 
  title, 
  description, 
  icon, 
  color 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  color: string;
}) => (
  <div className={`rounded-lg p-4 flex flex-col items-center text-center ${color}`}>
    <div className="rounded-full bg-background p-3 mb-3">
      {icon}
    </div>
    <h3 className="font-medium">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default Bonuses;
