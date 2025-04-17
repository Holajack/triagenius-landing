
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
  const [volume, setVolume] = useState(() => {
    // Try to load saved volume from localStorage
    try {
      const savedVolume = localStorage.getItem('soundVolume');
      return savedVolume ? parseFloat(savedVolume) : initialVolume;
    } catch (e) {
      return initialVolume;
    }
  });
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{title: string, artist?: string} | null>(null);
  const [loadRetries, setLoadRetries] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tracksRef = useRef<Array<{file_path: string, title: string, description?: string}>>([]);
  const bufferTimerRef = useRef<number | null>(null);
  const isFirstPlayRef = useRef(true);
  const isMountedRef = useRef(true);
  
  const { state } = useOnboarding();
  const { 
    soundFiles, 
    fetchSoundFilesByPreference, 
    getSoundFileUrl 
  } = useSoundFiles();
  
  // Initialize audio element
  useEffect(() => {
    if (!window.Audio) return;

    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    
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
      
      // Implement retry logic for loading failures
      if (loadRetries < 3) {
        setLoadRetries(prev => prev + 1);
        toast.error('Error playing audio track. Retrying...');
        
        setTimeout(() => {
          if (audioRef.current && tracksRef.current.length > 0) {
            const track = tracksRef.current[currentTrackIndex];
            if (track) {
              const url = getSoundFileUrl(track.file_path);
              audioRef.current.src = url;
              audioRef.current.load();
              audioRef.current.play()
                .catch(err => {
                  console.error('Retry error:', err);
                });
            }
          }
        }, 1000);
      } else {
        toast.error('Error playing audio track. Trying next track.');
        playNextTrack();
        setLoadRetries(0);
      }
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
  
  // Handle volume changes and save to localStorage
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    
    try {
      localStorage.setItem('soundVolume', volume.toString());
    } catch (e) {
      console.error('Error saving volume to localStorage', e);
    }
  }, [volume]);
  
  // Load tracks based on user preference
  useEffect(() => {
    const loadTracks = async () => {
      if (!enabled) return;
      
      const preference = state.soundPreference || 'lo-fi';
      console.log(`Loading sound tracks for preference: ${preference}`);
      
      // Skip if preference is silence
      if (preference === 'silence') {
        console.log('Sound preference is silence, not loading tracks');
        tracksRef.current = [];
        return;
      }
      
      setIsLoading(true);
      
      try {
        console.log(`Fetching sound files for preference: ${preference}`);
        const tracks = await fetchSoundFilesByPreference(preference);
        console.log(`Loaded ${tracks.length} tracks for preference ${preference}:`, tracks);
        tracksRef.current = tracks;
        
        if (tracks.length > 0 && autoPlay && isMountedRef.current) {
          setCurrentTrackIndex(0);
          
          const track = tracks[0];
          setCurrentTrack({
            title: track.title,
            artist: track.description ? track.description.split(' - ')[0] : undefined
          });
          
          const url = getSoundFileUrl(track.file_path);
          console.log(`Setting up first track: ${track.title} with URL: ${url}`);
          
          if (audioRef.current) {
            audioRef.current.src = url;
            
            if (isFirstPlayRef.current) {
              // Small delay for first play to avoid UI blocking
              setTimeout(() => {
                if (audioRef.current && isMountedRef.current) {
                  console.log('Attempting first play...');
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
            } else {
              console.log('Attempting to play track...');
              audioRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                  console.log('Playback started successfully');
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
        toast.error('Failed to load sound tracks. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTracks();
    
    return () => {
      // Stop any playing audio when preference changes
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
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
      console.log(`Playing next track: ${track.title} with URL: ${url}`);
      
      audioRef.current.src = url;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          console.log('Next track playing successfully');
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
      console.log(`Playing previous track: ${track.title} with URL: ${url}`);
      
      audioRef.current.src = url;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          console.log('Previous track playing successfully');
        })
        .catch(err => {
          console.error('Error playing previous track:', err);
        });
    }
  };
  
  // Play or pause the current track
  const togglePlay = () => {
    if (!isMountedRef.current || !enabled || !audioRef.current) return;
    
    if (isPlaying) {
      console.log('Pausing playback');
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (tracksRef.current.length === 0) {
        console.log('No tracks available to play');
        return;
      }
      
      console.log('Resuming playback');
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          console.log('Playback resumed successfully');
        })
        .catch(err => {
          console.error('Error playing track:', err);
          toast.error('Couldn\'t play audio. Please interact with the page first.');
        });
    }
  };
  
  // Stop playback and cleanup
  const stopPlayback = () => {
    if (audioRef.current) {
      console.log('Stopping playback');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    
    if (bufferTimerRef.current) {
      window.clearTimeout(bufferTimerRef.current);
      bufferTimerRef.current = null;
    }
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
