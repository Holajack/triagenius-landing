
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Timer, AlertCircle, Coffee, Brain, Music, Volume2, VolumeX, Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/common/PageHeader";
import { useSoundPlayback } from "@/hooks/use-sound-playback";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BreakTimer = () => {
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [breakTime, setBreakTime] = useState(300); // 5 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(breakTime);
  const [progress, setProgress] = useState(100);
  const [isBreakComplete, setIsBreakComplete] = useState(false);
  const [showFirstConfirmDialog, setShowFirstConfirmDialog] = useState(false);
  const [showSecondConfirmDialog, setShowSecondConfirmDialog] = useState(false);
  const [showSoundControls, setShowSoundControls] = useState(false);
  
  const timerRef = useRef<number>();
  
  // Initialize sound playback with saved volume from localStorage
  const savedVolume = parseFloat(localStorage.getItem('soundVolume') || '0.3');
  
  // Initialize sound playback with sound preference from onboarding state
  const { 
    isPlaying,
    currentTrack, 
    volume,
    setVolume,
    togglePlay,
    stopPlayback,
    playNextTrack,
    playPrevTrack
  } = useSoundPlayback({
    autoPlay: true,
    volume: savedVolume,
    enabled: state.soundPreference !== 'silence'
  });
  
  useEffect(() => {
    // Start the break timer
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          setIsBreakComplete(true);
          toast.success("Break complete! Ready for your next session.");
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Stop audio playback when unmounting
      stopPlayback();
    };
  }, [stopPlayback]);
  
  useEffect(() => {
    // Update progress bar
    setProgress((timeLeft / breakTime) * 100);
  }, [timeLeft, breakTime]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleEndBreak = () => {
    // Show the first confirmation dialog
    setShowFirstConfirmDialog(true);
  };
  
  const handleFirstDialogConfirm = () => {
    // Close the first dialog and open the second one
    setShowFirstConfirmDialog(false);
    setShowSecondConfirmDialog(true);
  };
  
  const handleSecondDialogConfirm = () => {
    // User confirmed twice that they want to end the break
    if (timerRef.current) clearInterval(timerRef.current);
    setShowSecondConfirmDialog(false);
    
    // Navigate to the session report page
    navigate("/session-report");
  };
  
  const handleBreakComplete = () => {
    // Navigate to the session report page when break is complete
    navigate("/session-report");
  };
  
  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col items-center p-4",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader title="Break Time" subtitle="Rest and recharge your mind" />
          
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
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={playPrevTrack}
                    disabled={!currentTrack}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
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
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={playNextTrack}
                    disabled={!currentTrack}
                  >
                    <SkipForward className="h-4 w-4" />
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
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Coffee className="mr-2 h-6 w-6 text-primary" />
              Time for a Break
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <div className="text-4xl font-mono tabular-nums">
              {formatTime(timeLeft)}
            </div>
            
            <Progress value={progress} className="w-full h-2" />
            
            <div className="text-center max-w-md mt-4">
              <p className="text-muted-foreground mb-4">
                Taking regular breaks improves overall productivity and enhances learning. 
                Your brain needs this time to process information.
              </p>
              
              <div className="p-4 bg-muted rounded-lg mb-4">
                <div className="flex items-center mb-2">
                  <Brain className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">Did you know?</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Research shows that regular breaks can boost creativity, improve memory retention, 
                  and reduce mental fatigue.
                </p>
              </div>
              
              {isBreakComplete ? (
                <Button 
                  size="lg" 
                  className="w-full md:w-auto mt-4"
                  onClick={handleBreakComplete}
                >
                  <Timer className="mr-2 h-5 w-5" />
                  Continue to Report
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full md:w-auto mt-4"
                  onClick={handleEndBreak}
                >
                  End Break Early
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* First Confirmation Dialog */}
      <AlertDialog open={showFirstConfirmDialog} onOpenChange={setShowFirstConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-10 w-10 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-center">
              Are you sure you want to end your break?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Taking regular breaks helps your brain process information and improves learning.
              Consider giving yourself the full break time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0">
            <AlertDialogCancel>Continue Break</AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstDialogConfirm}>
              Yes, End Break
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Second Confirmation Dialog */}
      <AlertDialog open={showSecondConfirmDialog} onOpenChange={setShowSecondConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <Brain className="h-10 w-10 text-primary" />
            </div>
            <AlertDialogTitle className="text-center">
              Final confirmation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Research shows your brain learns better with adequate breaks. 
              Resting helps consolidate learning and improves memory retention.
              <br /><br />
              <span className="font-medium">Are you absolutely sure you want to skip this break?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0">
            <AlertDialogCancel>You're right, I'll rest</AlertDialogCancel>
            <AlertDialogAction onClick={handleSecondDialogConfirm}>
              Yes, I'm sure
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BreakTimer;
