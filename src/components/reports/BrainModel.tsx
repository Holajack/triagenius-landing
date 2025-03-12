
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { BrainScene } from "./brain/BrainScene";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

interface BrainModelProps {
  activeRegion: string | null;
  setActiveRegion: (region: string | null) => void;
  zoomLevel: number;
  rotation: number;
}

const BrainModel = ({ activeRegion, setActiveRegion, zoomLevel, rotation }: BrainModelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    // Simulate loading the 3D model
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const getRegionDescription = (regionName: string | null) => {
    switch (regionName) {
      case "Memory Retention":
        return "Mountain region associated with memory-based learning activities. This cognitive function is strengthened through repetitive study, flashcards, and spaced repetition techniques. Recent focus on vocabulary memorization and fact-based study has stimulated growth in this area. Regular memory exercises and recall practice will help maintain this cognitive peak.";
      case "Critical Thinking":
        return "A towering peak representing analytical problem-solving abilities. This cognitive area activates during mathematics, logic puzzles, and complex reasoning tasks. Your recent coding sessions have significantly developed this region. Challenge yourself with increasingly difficult problems to continue building this cognitive muscle.";
      case "Problem Solving":
        return "This rugged terrain shows your ability to work through complex challenges methodically. Activated during debugging sessions, mathematical problem sets, and research-based tasks. Your consistent engagement with algorithmic challenges has strengthened this region. For optimal growth, try varying the types of problems you tackle.";
      case "Creativity":
        return "A rolling, expansive region representing creative and divergent thinking. This cognitive function flourishes during brainstorming, design work, and open-ended exploration. Your artistic endeavors and innovative problem approaches have nurtured this area. To further develop, incorporate more unstructured thinking time and creative expression.";
      case "Analytical Processing":
        return "A structured plateau representing your ability to analyze complex information and detect patterns. This region activates during data analysis, structured reading, and systematic evaluation. Your detailed note-taking and information categorization have built this cognitive terrain. Practice breaking down complex subjects into components to strengthen this area.";
      case "Language Processing":
        return "A gentle slope indicating verbal and written language comprehension and production. Active during reading, writing, and language learning activities. Your consistent reading habits have created a solid foundation here. Engaging with varied writing styles and new vocabulary will continue to shape this cognitive landscape.";
      case "Spatial Awareness":
        return "Rocky terrain representing your understanding of objects in space and their relationships. This region is activated during visualization exercises, map reading, and physical navigation tasks. Your recent work with diagrams and 3D modeling has developed this area. Consider incorporating more spatial puzzles to further strengthen this cognitive function.";
      case "Visual Processing":
        return "A smooth hill representing your ability to interpret and remember visual information. This cognitive area is engaged during graph interpretation, image analysis, and visual learning. Your work with diagrams and infographics has gradually built this region. Regular practice with visual elements will maintain and enhance this cognitive landscape.";
      case "Focus & Concentration":
        return "The highest peak in your cognitive mountain range, representing sustained attention and concentration abilities. This fundamental cognitive function supports all other learning activities. Your meditation practice and timed study sessions have significantly developed this region. Maintaining regular focus exercises will keep this peak towering over your cognitive landscape.";
      default:
        return "";
    }
  };

  const getRegionFunction = (regionName: string | null) => {
    switch (regionName) {
      case "Memory Retention":
        return "Flashcards, spaced repetition, fact memorization";
      case "Critical Thinking":
        return "Analysis, evaluation, logical reasoning";
      case "Problem Solving":
        return "Mathematics, coding challenges, complex puzzles";
      case "Creativity":
        return "Brainstorming, design thinking, artistic work";
      case "Analytical Processing":
        return "Data analysis, structured reading, categorization";
      case "Language Processing":
        return "Reading, writing, language learning";
      case "Spatial Awareness":
        return "Visualization, mapping, 3D relationships";
      case "Visual Processing":
        return "Image analysis, pattern recognition, visual learning";
      case "Focus & Concentration":
        return "Sustained attention, deep work, meditation";
      default:
        return "";
    }
  };

  const getRecommendedActivities = (regionName: string | null) => {
    switch (regionName) {
      case "Memory Retention":
        return "Try Anki flashcards, practice retrieval exercises, or create memory palaces";
      case "Critical Thinking":
        return "Engage with logical puzzles, debate opposing viewpoints, analyze case studies";
      case "Problem Solving":
        return "Work through coding challenges, solve mathematical problems, try escape rooms";
      case "Creativity":
        return "Practice freestyle writing, try mind mapping, engage in artistic expression";
      case "Analytical Processing":
        return "Create structured outlines, analyze datasets, practice syllogistic reasoning";
      case "Language Processing":
        return "Read diverse literature, practice writing, learn a new language";
      case "Spatial Awareness":
        return "Practice mental rotation exercises, work with 3D modeling, try navigation games";
      case "Visual Processing":
        return "Study and create infographics, practice sketch noting, analyze visual patterns";
      case "Focus & Concentration":
        return "Practice pomodoro technique, try meditation, eliminate distractions";
      default:
        return "";
    }
  };

  return (
    <div className="w-full h-full relative">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="h-[400px] relative">
            <BrainScene
              activeRegion={activeRegion}
              setActiveRegion={setActiveRegion}
              zoomLevel={zoomLevel}
              rotation={rotation}
            />
            
            {/* Interactive hint */}
            {!activeRegion && (
              <div className="absolute top-4 left-4 flex items-center bg-background/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-muted-foreground animate-pulse">
                <Info className="h-3 w-3 mr-1.5" />
                Click on a mountain to learn about cognitive activities
              </div>
            )}
          </div>

          {/* Info overlay when region is selected */}
          {activeRegion && (
            <Card className={`absolute bottom-0 left-0 right-0 ${
              theme === 'dark' ? 'bg-gray-800/90' : 'bg-background/90'
            } backdrop-blur-sm p-3 border-t`}>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-lg">{activeRegion}</h4>
                  <div className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    {getRegionFunction(activeRegion)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-tight mb-2">
                  {getRegionDescription(activeRegion)}
                </p>
                <div className="text-xs px-2 py-1 rounded bg-primary/10 text-primary-foreground">
                  <strong>Recommended Activities:</strong> {getRecommendedActivities(activeRegion)}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default BrainModel;
