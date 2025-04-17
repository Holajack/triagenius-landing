
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BookText, CheckCheck, RotateCcw, MessageCircle, Music, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/common/PageHeader";
import { toast } from "sonner";
import { useSoundPlayback } from "@/hooks/use-sound-playback";
import { Slider } from "@/components/ui/slider";

const SessionReflection = () => {
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [accomplished, setAccomplished] = useState("");
  const [learned, setLearned] = useState("");
  const [revisit, setRevisit] = useState("");
  const [showSoundControls, setShowSoundControls] = useState(false);
  
  // Initialize sound playback with user preferences
  const { 
    isPlaying,
    currentTrack, 
    volume,
    setVolume,
    togglePlay,
    stopPlayback
  } = useSoundPlayback({
    autoPlay: true,
    volume: 0.3,
    enabled: state.soundPreference !== 'silence'
  });
  
  // Clean up sound when unmounting
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);
  
  const handleSubmit = () => {
    // Save reflection data to localStorage for potential future use
    const reflectionData = {
      accomplished,
      learned,
      revisit,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem("sessionReflection", JSON.stringify(reflectionData));
    toast.success("Reflection saved successfully!");
    
    // Navigate to the break timer page
    navigate("/break-timer");
  };
  
  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col items-center p-4",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader title="Session Reflection" subtitle="Take a moment to reflect on your focus session" />
          
          {state.soundPreference !== 'silence' && (
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowSoundControls(!showSoundControls)}
              >
                <Music className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {showSoundControls && (
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={togglePlay}
                  >
                    {isPlaying ? 
                      <Pause className="h-4 w-4" /> : 
                      <Play className="h-4 w-4" />
                    }
                  </Button>
                  
                  <div className="ml-2">
                    <p className="text-sm font-medium line-clamp-1">
                      {currentTrack?.title || 'No track playing'}
                    </p>
                    {currentTrack?.artist && (
                      <p className="text-xs text-muted-foreground">
                        {currentTrack.artist}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <Slider
                    className="w-24"
                    value={[volume * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVolume(value[0] / 100)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5 text-primary" />
              Why Reflect?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Taking a moment to reflect on your focus session helps solidify your learning and identify areas for improvement.
              Research shows that reflection is a key component of effective learning and memory retention.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CheckCheck className="mr-2 h-5 w-5 text-primary" />
                What did you accomplish?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="List the tasks or goals you completed during this session..."
                className="min-h-[100px]"
                value={accomplished}
                onChange={(e) => setAccomplished(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <BookText className="mr-2 h-5 w-5 text-primary" />
                What did you learn?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What new concepts, insights, or skills did you gain?"
                className="min-h-[100px]"
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <RotateCcw className="mr-2 h-5 w-5 text-primary" />
                Topics to revisit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Are there any subtopics or concepts you want to revisit in your next session?"
                className="min-h-[100px]"
                value={revisit}
                onChange={(e) => setRevisit(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSubmit} size="lg">
            Submit Reflection & Take a Break
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionReflection;
