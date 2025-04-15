
import { useState, useEffect } from 'react';
import AudioPlayerService from '@/services/audioService';

export interface AudioState {
  isPlaying: boolean;
  volume: number;
  currentTrack: {
    url: string;
    name: string;
    duration?: number;
  } | null;
  playlist: Array<{
    url: string;
    name: string;
    duration?: number;
  }>;
  muted: boolean;
  loading: boolean;
  error: string | null;
}

export const useAudioPlayer = (initialPreference?: string) => {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    volume: 0.7,
    currentTrack: null,
    playlist: [],
    muted: false,
    loading: false,
    error: null
  });

  useEffect(() => {
    const audioService = AudioPlayerService.getInstance();
    
    // Subscribe to state changes
    const unsubscribe = audioService.subscribe(setAudioState);
    
    // If initialPreference is provided, load the playlist
    if (initialPreference) {
      audioService.loadPlaylistBySoundPreference(initialPreference);
    }
    
    return () => {
      unsubscribe();
    };
  }, [initialPreference]);
  
  const playPause = () => {
    const audioService = AudioPlayerService.getInstance();
    if (audioState.isPlaying) {
      audioService.pause();
    } else {
      audioService.play();
    }
  };
  
  const nextTrack = () => {
    const audioService = AudioPlayerService.getInstance();
    audioService.playNext();
  };
  
  const previousTrack = () => {
    const audioService = AudioPlayerService.getInstance();
    audioService.playPrevious();
  };
  
  const setVolume = (volume: number) => {
    const audioService = AudioPlayerService.getInstance();
    audioService.setVolume(volume);
  };
  
  const toggleMute = () => {
    const audioService = AudioPlayerService.getInstance();
    audioService.toggleMute();
  };
  
  const loadPlaylist = async (preference: string) => {
    const audioService = AudioPlayerService.getInstance();
    await audioService.loadPlaylistBySoundPreference(preference);
  };

  return {
    ...audioState,
    playPause,
    nextTrack,
    previousTrack,
    setVolume,
    toggleMute,
    loadPlaylist
  };
};
