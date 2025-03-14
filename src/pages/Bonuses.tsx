
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Brain, Book, PencilLine, Headphones, Eye, Hand, Lightbulb, BadgePercent } from "lucide-react";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { LearningPathScene } from "@/components/reports/brain/LearningPathScene";

const Bonuses = () => {
  const [activeTab, setActiveTab] = useState("quiz");
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  
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
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-[400px] rounded-lg overflow-hidden border bg-background relative">
                  <LearningPathScene 
                    activeSubject={activeSubject}
                    setActiveSubject={setActiveSubject}
                    zoomLevel={zoomLevel}
                    rotation={rotation}
                  />
                  
                  {/* Controls for the brain visualization */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setZoomLevel((prev) => Math.min(prev + 0.1, 1.5))}
                    >
                      +
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5))}
                    >
                      -
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setRotation((prev) => prev + 15)}
                    >
                      ↻
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    {activeSubject ? getBrainRegionName(activeSubject) : "Brain Learning Regions"}
                  </h3>
                  
                  <div className="space-y-4">
                    {!activeSubject ? (
                      <p className="text-muted-foreground">
                        Click on different regions of the brain to see how they relate to learning different subjects.
                        Each region specializes in processing different types of information.
                      </p>
                    ) : (
                      <>
                        <p>{getBrainRegionDescription(activeSubject)}</p>
                        <h4 className="font-medium mt-4">Recommended Subjects:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {getBrainRegionSubjects(activeSubject).map((subject, index) => (
                            <li key={index}>{subject}</li>
                          ))}
                        </ul>
                        <h4 className="font-medium mt-4">Study Techniques:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {getBrainRegionTechniques(activeSubject).map((technique, index) => (
                            <li key={index}>{technique}</li>
                          ))}
                        </ul>
                      </>
                    )}
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

// Helper functions for brain region data
function getBrainRegionName(region: string): string {
  switch(region) {
    case 'prefrontal': return 'Frontal Lobe: Planning & Decision-Making';
    case 'hippocampus': return 'Temporal Lobe: Memory Formation';
    case 'amygdala': return 'Limbic System: Emotional Learning';
    case 'cerebellum': return 'Cerebellum: Skill Mastery';
    case 'parietal': return 'Parietal Lobe: Problem Solving';
    default: return 'Brain Region';
  }
}

function getBrainRegionDescription(region: string): string {
  switch(region) {
    case 'prefrontal': 
      return `The frontal lobe handles executive functions like planning, decision-making, and critical thinking. It's essential for organizing your study approach and setting goals.`;
    case 'hippocampus': 
      return `Located in the temporal lobe, the hippocampus is crucial for forming new memories and retrieving existing ones. It helps you consolidate what you've learned into long-term memory.`;
    case 'amygdala': 
      return `Part of the limbic system, the amygdala processes emotional responses to information, making content more memorable when it has emotional significance.`;
    case 'cerebellum': 
      return `Though known for motor coordination, the cerebellum also plays a role in cognitive functions, especially procedural learning and skill mastery through practice.`;
    case 'parietal': 
      return `The parietal lobe integrates sensory information and is involved in mathematical reasoning, spatial awareness, and problem-solving tasks.`;
    default: 
      return `Select a brain region to learn more about its function in the learning process.`;
  }
}

function getBrainRegionSubjects(region: string): string[] {
  switch(region) {
    case 'prefrontal': 
      return ['Philosophy', 'Project Management', 'Strategic Planning', 'Ethics', 'Decision Theory'];
    case 'hippocampus': 
      return ['History', 'Foreign Languages', 'Vocabulary Building', 'Factual Sciences', 'Memorization Tasks'];
    case 'amygdala': 
      return ['Literature', 'Psychology', 'Arts', 'Music', 'Creative Writing'];
    case 'cerebellum': 
      return ['Music Practice', 'Sports', 'Laboratory Sciences', 'Crafts', 'Dance'];
    case 'parietal': 
      return ['Mathematics', 'Physics', 'Engineering', 'Geometry', 'Puzzle Solving'];
    default: 
      return [];
  }
}

function getBrainRegionTechniques(region: string): string[] {
  switch(region) {
    case 'prefrontal': 
      return ['Mind Mapping', 'Concept Organization', 'Decision Trees', 'Study Planning', 'Structured Note-Taking'];
    case 'hippocampus': 
      return ['Spaced Repetition', 'Flashcards', 'Mnemonic Devices', 'Storytelling', 'Association Techniques'];
    case 'amygdala': 
      return ['Emotion-Based Association', 'Personal Relevance Connections', 'Vivid Visualization', 'Study Environment Design'];
    case 'cerebellum': 
      return ['Hands-On Practice', 'Teaching Others', 'Model Building', 'Role Playing', 'Simulation Exercises'];
    case 'parietal': 
      return ['Problem Sets', 'Diagramming', 'Spatial Mapping', 'Pattern Recognition Exercises', 'Abstract Reasoning Tasks'];
    default: 
      return [];
  }
}

export default Bonuses;
