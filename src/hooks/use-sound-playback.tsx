
import { useState, useEffect, useRef } from 'react';
import { useSoundFiles } from './use-sound-files';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { SoundPreference } from '@/types/onboarding';
import { toast } from 'sonner';

export interface SoundPlaybackOptions {
  autoPlay?: boolean;
  volume?: number;
  enabled?: boolean;
}

export const useSoundPlayback = (options: SoundPlaybackOptions = {}) => {
  const { autoPlay = true, volume: initialVolume = 0.5, enabled = true } = options;
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{title: string, artist?: string} | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tracksRef = useRef<Array<{file_path: string, title: string, description?: string}>>([]);
  const bufferTimerRef = useRef<number | null>(null);
  const isFirstPlayRef = useRef(true);
  const isMountedRef = useRef(true);
  const isStoppingRef = useRef(false);
  
  const { state } = useOnboarding();
  const { 
    soundFiles, 
    fetchSoundFilesByPreference, 
    getSoundFileUrl 
  } = useSoundFiles();
  
  // Initialize audio element
  useEffect(() => {
    if (!window.Audio) return;

    console.log('Initializing audio element');
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    audioRef.current.loop = true; // Loop single tracks for better continuous playback
    
    const handleEnded = () => {
      if (!isMountedRef.current) return;
      
      console.log('Track ended, scheduling next track with buffer');
      
      // Add a small buffer between tracks
      if (bufferTimerRef.current) {
        window.clearTimeout(bufferTimerRef.current);
      }
      
      bufferTimerRef.current = window.setTimeout(() => {
        playNextTrack();
      }, 4000); // 4 second buffer between tracks
    };
    
    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
      toast.error('Error playing audio track. Trying next track.');
      playNextTrack();
    };
    
    const audio = audioRef.current;
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      isMountedRef.current = false;
      
      if (bufferTimerRef.current) {
        window.clearTimeout(bufferTimerRef.current);
        bufferTimerRef.current = null;
      }
      
      if (audio) {
        audio.pause();
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audioRef.current = null;
      }
    };
  }, []);
  
  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // Load tracks based on user preference
  useEffect(() => {
    const loadTracks = async () => {
      if (!enabled) return;
      
      const preference = state.soundPreference || 'lo-fi';
      
      // Skip if preference is silence
      if (preference === 'silence') {
        tracksRef.current = [];
        return;
      }
      
      setIsLoading(true);
      
      try {
        console.log('Loading tracks for preference:', preference);
        const tracks = await fetchSoundFilesByPreference(preference);
        console.log('Loaded tracks:', tracks);
        tracksRef.current = tracks;
        
        if (tracks.length > 0 && autoPlay && isMountedRef.current) {
          setCurrentTrackIndex(0);
          
          const track = tracks[0];
          setCurrentTrack({
            title: track.title,
            artist: track.description ? track.description.split(' - ')[0] : undefined
          });
          
          const url = getSoundFileUrl(track.file_path);
          console.log('Setting audio source to:', url);
          
          if (audioRef.current) {
            audioRef.current.src = url;
            
            if (isFirstPlayRef.current) {
              // Small delay for first play to avoid UI blocking
              setTimeout(() => {
                if (audioRef.current && isMountedRef.current) {
                  console.log('Attempting first play');
                  audioRef.current.play()
                    .then(() => {
                      setIsPlaying(true);
                      isFirstPlayRef.current = false;
                      console.log('First play successful');
                    })
                    .catch(err => {
                      console.error('Error playing first track:', err);
                      // Don't show error toast for first play as it might be blocked by browser
                      isFirstPlayRef.current = false;
                    });
                }
              }, 1000);
            } else if (autoPlay) {
              console.log('Attempting to play audio');
              audioRef.current.play()
                .then(() => {
                  console.log('Play successful');
                  setIsPlaying(true);
                })
                .catch(err => {
                  console.error('Error playing track:', err);
                  toast.error('Couldn\'t play audio automatically. Please interact with the page first.');
                });
            }
          }
        }
      } catch (error) {
        console.error('Error loading sound tracks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTracks();
  }, [state.soundPreference, enabled, autoPlay, fetchSoundFilesByPreference, getSoundFileUrl]);
  
  // Play the next track in the playlist
  const playNextTrack = () => {
    if (!isMountedRef.current || !enabled || tracksRef.current.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % tracksRef.current.length;
    setCurrentTrackIndex(nextIndex);
    
    const track = tracksRef.current[nextIndex];
    setCurrentTrack({
      title: track.title,
      artist: track.description ? track.description.split(' - ')[0] : undefined
    });
    
    if (audioRef.current) {
      const url = getSoundFileUrl(track.file_path);
      console.log('Playing next track:', url);
      audioRef.current.src = url;
      audioRef.current.play()
        .then(() => {
          console.log('Next track playing successfully');
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('Error playing next track:', err);
          // Try the next track if this one fails
          setTimeout(playNextTrack, 1000);
        });
    }
  };
  
  // Play the previous track in the playlist
  const playPrevTrack = () => {
    if (!isMountedRef.current || !enabled || tracksRef.current.length === 0) return;
    
    const prevIndex = currentTrackIndex === 0 
      ? tracksRef.current.length - 1 
      : currentTrackIndex - 1;
    
    setCurrentTrackIndex(prevIndex);
    
    const track = tracksRef.current[prevIndex];
    setCurrentTrack({
      title: track.title,
      artist: track.description ? track.description.split(' - ')[0] : undefined
    });
    
    if (audioRef.current) {
      const url = getSoundFileUrl(track.file_path);
      console.log('Playing previous track:', url);
      audioRef.current.src = url;
      audioRef.current.play()
        .then(() => {
          console.log('Previous track playing successfully');
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('Error playing previous track:', err);
        });
    }
  };
  
  // Play or pause the current track
  const togglePlay = () => {
    if (!isMountedRef.current || !enabled || !audioRef.current) {
      console.log('Cannot toggle play: audio not ready or not enabled');
      return;
    }
    
    console.log('Toggle play called, current state:', isPlaying);
    
    if (isPlaying) {
      console.log('Pausing audio');
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (tracksRef.current.length === 0) {
        console.log('No tracks available to play');
        return;
      }
      
      // Make sure we have a valid source
      if (!audioRef.current.src || audioRef.current.src === '') {
        const track = tracksRef.current[currentTrackIndex];
        if (track) {
          const url = getSoundFileUrl(track.file_path);
          console.log('Setting source to:', url);
          audioRef.current.src = url;
        } else {
          console.error('No track available at index:', currentTrackIndex);
          return;
        }
      }
      
      console.log('Attempting to play audio');
      audioRef.current.play()
        .then(() => {
          console.log('Audio playing successfully');
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('Error playing track:', err);
          toast.error('Couldn\'t play audio. Please interact with the page first.');
        });
    }
  };
  
  // Stop playback and cleanup
  const stopPlayback = () => {
    // Prevent multiple stop calls
    if (isStoppingRef.current) {
      console.log('Already stopping playback, ignoring duplicate call');
      return;
    }
    
    isStoppingRef.current = true;
    console.log('Stopping playback');
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    
    if (bufferTimerRef.current) {
      window.clearTimeout(bufferTimerRef.current);
      bufferTimerRef.current = null;
    }
    
    // Reset stopping flag after a short delay
    setTimeout(() => {
      isStoppingRef.current = false;
    }, 100);
  };

  return {
    isPlaying,
    isLoading,
    currentTrack,
    volume,
    setVolume,
    togglePlay,
    playNextTrack,
    playPrevTrack,
    stopPlayback,
    audioRef
  };
};
