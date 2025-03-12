
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
      case "Frontal Lobe":
        return "The largest lobe of the brain, located at the front. Executive function center responsible for decision-making, planning, problem-solving, self-control, and complex cognitive behaviors. Critical for personality, working memory, and higher-order thinking. Most active during analytical tasks and critical reasoning.";
      case "Temporal Lobe":
        return "Located on the sides of the brain beneath the lateral fissure. Processes auditory information and plays a key role in language comprehension, memory formation, and emotion regulation. Houses the hippocampus for long-term memory and amygdala for emotional processing. Essential for verbal learning and memory retrieval.";
      case "Parietal Lobe":
        return "Located behind the frontal lobe and above the temporal lobe. Integrates sensory information and spatial awareness. Responsible for processing touch, pressure, temperature, and pain. Crucial for mathematics, reading comprehension, and navigation tasks requiring spatial orientation and body awareness.";
      case "Occipital Lobe":
        return "Located at the back of the brain. Primary visual processing center that interprets signals from the retina. Processes visual information including color, form, motion, and spatial relationships. Essential for reading, visual learning, pattern recognition, and interpreting symbols and diagrams.";
      case "Cerebellum":
        return "Located at the base of the brain below the occipital lobe. Controls coordination, precision, and timing of movements. Plays a role in motor learning, balance, posture, and fine muscle control. Recent research shows it's also involved in cognitive functions including attention and language processing.";
      case "Brain Stem":
        return "Located at the base of the brain, connecting to the spinal cord. Controls basic life functions including breathing, heart rate, blood pressure, and sleep cycles. Manages alertness, consciousness, and maintains the autonomic nervous system. Critical for concentration and arousal.";
      case "Hippocampus":
        return "Deep structure within the temporal lobe shaped like a seahorse. Essential for forming new memories, particularly declarative memories for facts and events. Crucial for spatial navigation and orientation. Damage to the hippocampus causes anterograde amnesia - the inability to form new memories.";
      case "Thalamus":
        return "Located near the center of the brain. Acts as the brain's relay station, processing and transmitting almost all sensory information to the cerebral cortex. Plays a role in regulating consciousness, sleep, and alertness. Helps filter relevant sensory information from background noise.";
      default:
        return "";
    }
  };

  const getRegionFunction = (regionName: string | null) => {
    switch (regionName) {
      case "Frontal Lobe":
        return "Critical thinking, reasoning, planning, organization";
      case "Temporal Lobe":
        return "Memory, language processing, auditory comprehension";
      case "Parietal Lobe":
        return "Sensory integration, spatial awareness, mathematics";
      case "Occipital Lobe":
        return "Visual processing, pattern recognition, reading";
      case "Cerebellum":
        return "Motor learning, balance, coordination, timing";
      case "Brain Stem":
        return "Vital functions, alertness, attention regulation";
      case "Hippocampus":
        return "Memory formation, spatial navigation, learning";
      case "Thalamus":
        return "Sensory relay, information filtering, consciousness";
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
                Click on a brain region to learn more
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
                <p className="text-sm text-muted-foreground leading-tight">
                  {getRegionDescription(activeRegion)}
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default BrainModel;
