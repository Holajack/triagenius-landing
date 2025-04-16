
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { SoundPreference } from "@/types/onboarding";
import { Headphones, Music, Volume2, VolumeX, Wind, Leaf } from "lucide-react";
import { useSoundFiles } from "@/hooks/use-sound-files";
import { Skeleton } from "@/components/ui/skeleton";

const soundCategoryIcons: Record<SoundPreference, React.ReactNode> = {
  'lo-fi': <Music className="w-6 h-6" />,
  'ambient': <Wind className="w-6 h-6" />,
  'classical': <Music className="w-6 h-6 rotate-45" />,
  'nature': <Leaf className="w-6 h-6" />,
  'silence': <VolumeX className="w-6 h-6" />,
};

const defaultSounds: Array<{ id: SoundPreference; title: string; description: string; }> = [
  {
    id: 'lo-fi',
    title: 'Lo-fi',
    description: 'Calm background beats',
  },
  {
    id: 'ambient',
    title: 'Ambient',
    description: 'Soothing environmental sounds',
  },
  {
    id: 'nature',
    title: 'Nature',
    description: 'Peaceful nature sounds',
  },
  {
    id: 'classical',
    title: 'Classical',
    description: 'Timeless orchestral pieces',
  },
  {
    id: 'silence',
    title: 'Silence',
    description: 'No background audio',
  }
];

export const SoundStep = () => {
  const { state, dispatch } = useOnboarding();
  const { soundFiles, isLoading, fetchSoundFiles } = useSoundFiles();
  const [availableSounds, setAvailableSounds] = useState(defaultSounds);
  const [previewSound, setPreviewSound] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  // Set up audio player
  useEffect(() => {
    const player = new Audio();
    player.addEventListener('ended', () => setPreviewSound(null));
    setAudioPlayer(player);
    return () => {
      player.pause();
      player.src = '';
    };
  }, []);

  // Play/pause sound preview
  useEffect(() => {
    if (audioPlayer) {
      if (previewSound) {
        audioPlayer.src = previewSound;
        audioPlayer.play().catch(err => console.error("Error playing audio:", err));
      } else {
        audioPlayer.pause();
      }
    }
    
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, [previewSound, audioPlayer]);

  // Handle sound category selection
  const handleSoundSelection = (soundId: SoundPreference) => {
    dispatch({ type: 'SET_SOUND_PREFERENCE', payload: soundId });
    if (previewSound) {
      setPreviewSound(null);
    }
  };

  // Preview sound when available
  const handlePreviewToggle = (url: string | null) => {
    if (previewSound === url) {
      setPreviewSound(null);
    } else {
      setPreviewSound(url);
    }
  };

  return (
    <div className="grid gap-4">
      {isLoading ? (
        // Loading skeleton
        Array.from({ length: 4 }).map((_, index) => (
          <Card key={`skeleton-${index}`} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </Card>
        ))
      ) : (
        // Sound categories
        defaultSounds.map((sound) => (
          <Card
            key={sound.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              state.soundPreference === sound.id ? 'border-triage-purple shadow-md' : ''
            }`}
            onClick={() => handleSoundSelection(sound.id)}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-purple-100 text-triage-purple">
                {soundCategoryIcons[sound.id]}
              </div>
              <div>
                <h3 className="font-medium mb-1">{sound.title}</h3>
                <p className="text-sm text-gray-600">{sound.description}</p>
              </div>
              {sound.id !== 'silence' && (
                <button 
                  className="ml-auto p-2 rounded-full hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Logic to preview sound would go here
                    // This is a placeholder for future functionality
                  }}
                >
                  {previewSound ? (
                    <VolumeX className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};
