
import React, { useEffect, useState } from 'react';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MusicPlayerProps {
  className?: string;
  compact?: boolean;
  lowPowerMode?: boolean;
  onToggleMusic?: (isPlaying: boolean) => void;
}

const MusicPlayer = ({
  className,
  compact = false,
  lowPowerMode = false,
  onToggleMusic
}: MusicPlayerProps) => {
  const { state } = useOnboarding();
  const [soundPreference, setSoundPreference] = useState<string>(state.soundPreference || 'ambient');
  const isMobile = useIsMobile();
  
  const {
    isPlaying,
    currentTrack,
    volume,
    muted,
    loading,
    playPause,
    nextTrack,
    previousTrack,
    setVolume,
    toggleMute,
    loadPlaylist
  } = useAudioPlayer();
  
  useEffect(() => {
    // Get sound preference from localStorage or state
    const savedPreference = localStorage.getItem('soundPreference') || state.soundPreference || 'ambient';
    setSoundPreference(savedPreference);
    
    // Load the playlist for the sound preference
    loadPlaylist(savedPreference);
  }, [state.soundPreference]);
  
  useEffect(() => {
    if (onToggleMusic) {
      onToggleMusic(isPlaying);
    }
  }, [isPlaying, onToggleMusic]);
  
  if (lowPowerMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("flex items-center", className)}
        onClick={playPause}
      >
        {isPlaying ? (
          <>
            <Pause className="w-3 h-3 mr-1" />
            <span className="text-xs">Pause Music</span>
          </>
        ) : (
          <>
            <Play className="w-3 h-3 mr-1" />
            <span className="text-xs">Play {getSoundPreferenceLabel(soundPreference)}</span>
          </>
        )}
      </Button>
    );
  }
  
  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={playPause}
          disabled={loading}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <div className="flex-1 text-xs truncate max-w-[100px]">
          {currentTrack ? formatTrackName(currentTrack.name) : getSoundPreferenceLabel(soundPreference)}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={toggleMute}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col p-2 bg-background/90 rounded-md shadow-sm", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Music className="w-4 h-4 mr-1 text-primary" />
          <span className="text-sm font-medium">{getSoundPreferenceLabel(soundPreference)}</span>
        </div>
        
        {currentTrack && (
          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
            {formatTrackName(currentTrack.name)}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={previousTrack}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant={isPlaying ? "secondary" : "default"}
          size="sm"
          className="h-8"
          onClick={playPause}
          disabled={loading}
        >
          {loading ? (
            <span className="animate-pulse">Loading...</span>
          ) : isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-1" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              <span>Play</span>
            </>
          )}
        </Button>
        
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={nextTrack}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex items-center gap-2 ml-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleMute}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <Slider
            value={[muted ? 0 : volume * 100]}
            min={0}
            max={100}
            step={1}
            className="w-20"
            onValueChange={(value) => setVolume(value[0] / 100)}
          />
        </div>
      </div>
    </div>
  );
};

// Helper function to format track names
function formatTrackName(name: string): string {
  // Remove file extension and replace dashes/underscores with spaces
  return name
    .replace(/\.(mp3|wav|ogg|m4a)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between camelCase
}

// Helper function to get a display label for the sound preference
function getSoundPreferenceLabel(preference: string): string {
  switch (preference.toLowerCase()) {
    case 'ambient':
      return 'Ambient Music';
    case 'lo-fi':
      return 'Lo-Fi Music';
    case 'nature':
      return 'Nature Sounds';
    case 'classical':
      return 'Classical Music';
    default:
      return 'Background Music';
  }
}

export default MusicPlayer;
