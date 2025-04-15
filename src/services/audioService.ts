
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AudioTrack {
  url: string;
  name: string;
  duration?: number;
}

interface AudioPlayerState {
  isPlaying: boolean;
  volume: number;
  currentTrack: AudioTrack | null;
  playlist: AudioTrack[];
  muted: boolean;
  loading: boolean;
  error: string | null;
}

class AudioPlayerService {
  private static instance: AudioPlayerService;
  private audioElement: HTMLAudioElement | null = null;
  private playlist: AudioTrack[] = [];
  private currentTrackIndex = 0;
  private isPlaying = false;
  private volume = 0.7; // Default volume at 70%
  private muted = false;
  private soundPreference: string | null = null;
  private isLoading = false;
  private onStateChangeCallbacks: ((state: AudioPlayerState) => void)[] = [];
  private fadeOutTimeout: number | null = null;
  private fadeInTimeout: number | null = null;
  
  private constructor() {
    // Singleton pattern - private constructor
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.setupEventListeners();
    }
  }
  
  public static getInstance(): AudioPlayerService {
    if (!AudioPlayerService.instance) {
      AudioPlayerService.instance = new AudioPlayerService();
    }
    return AudioPlayerService.instance;
  }
  
  private setupEventListeners(): void {
    if (!this.audioElement) return;
    
    this.audioElement.addEventListener('ended', this.handleTrackEnded.bind(this));
    this.audioElement.addEventListener('error', this.handleError.bind(this));
    this.audioElement.addEventListener('canplaythrough', this.handleCanPlay.bind(this));
    
    // Handle visibility change to pause/resume playback
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }
  
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      // User navigated away from the page
      // We don't pause here, letting the audio continue in the background
    } else {
      // User is back to the page
      if (this.isPlaying && this.audioElement && this.audioElement.paused) {
        this.audioElement.play().catch(this.handleError.bind(this));
      }
    }
  }
  
  private handleTrackEnded(): void {
    // Play the next track when the current one ends
    this.playNext();
  }
  
  private handleCanPlay(): void {
    if (this.isLoading) {
      this.isLoading = false;
      this.notifyStateChange();
    }
  }
  
  private handleError(error: any): void {
    console.error('Audio player error:', error);
    this.isLoading = false;
    const errorMessage = error?.message || 'Error playing audio';
    this.notifyStateChange(errorMessage);
    
    // Try the next track if there's an error
    if (this.playlist.length > 0) {
      setTimeout(() => this.playNext(), 1000);
    }
  }
  
  private notifyStateChange(error: string | null = null): void {
    const state: AudioPlayerState = {
      isPlaying: this.isPlaying,
      volume: this.volume,
      currentTrack: this.getCurrentTrack(),
      playlist: this.playlist,
      muted: this.muted,
      loading: this.isLoading,
      error
    };
    
    this.onStateChangeCallbacks.forEach(callback => callback(state));
  }
  
  public subscribe(callback: (state: AudioPlayerState) => void): () => void {
    this.onStateChangeCallbacks.push(callback);
    
    // Immediately notify the new subscriber of the current state
    callback({
      isPlaying: this.isPlaying,
      volume: this.volume,
      currentTrack: this.getCurrentTrack(),
      playlist: this.playlist,
      muted: this.muted,
      loading: this.isLoading,
      error: null
    });
    
    // Return an unsubscribe function
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(cb => cb !== callback);
    };
  }
  
  public async loadPlaylistBySoundPreference(preference: string): Promise<void> {
    try {
      this.isLoading = true;
      this.soundPreference = preference;
      this.notifyStateChange();
      
      // Map the sound preference to the appropriate folder
      const folderName = this.mapPreferenceToFolder(preference);
      console.log(`Loading music from folder: ${folderName}`);
      
      const { data, error } = await supabase
        .storage
        .from('music_files')
        .list(folderName);
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        this.isLoading = false;
        console.log('No audio files found for preference:', preference);
        this.notifyStateChange('No audio files found for this preference');
        return;
      }
      
      // Filter for audio files only
      const audioFiles = data.filter(file => 
        file.name.endsWith('.mp3') || 
        file.name.endsWith('.wav') || 
        file.name.endsWith('.ogg') ||
        file.name.endsWith('.m4a')
      );
      
      if (audioFiles.length === 0) {
        this.isLoading = false;
        console.log('No supported audio files found for preference:', preference);
        this.notifyStateChange('No supported audio files found for this preference');
        return;
      }
      
      // Create playlist from the files
      this.playlist = audioFiles.map(file => {
        const { publicUrl } = supabase.storage
          .from('music_files')
          .getPublicUrl(`${folderName}/${file.name}`);
          
        return {
          url: publicUrl,
          name: file.name
        };
      });
      
      // Shuffle the playlist for variety
      this.shufflePlaylist();
      
      console.log(`Loaded ${this.playlist.length} tracks for ${preference}`);
      
      // Reset the current track index
      this.currentTrackIndex = 0;
      
      this.isLoading = false;
      this.notifyStateChange();
      
      // Start playing if we were already playing something
      if (this.isPlaying) {
        this.play();
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
      this.isLoading = false;
      this.notifyStateChange('Failed to load audio playlist');
      toast.error('Failed to load audio playlist');
    }
  }
  
  public async loadPlaylistFromUseSoundFiles(): Promise<void> {
    try {
      // Load the sound preference from localStorage
      const soundPreference = localStorage.getItem('soundPreference') || 'ambient';
      await this.loadPlaylistBySoundPreference(soundPreference);
    } catch (error) {
      console.error('Error loading playlist from sound files:', error);
      this.isLoading = false;
      this.notifyStateChange('Failed to load audio playlist');
    }
  }
  
  private mapPreferenceToFolder(preference: string): string {
    // Map the sound preference to the corresponding folder in the storage bucket
    switch (preference.toLowerCase()) {
      case 'ambient':
        return 'Ambient';
      case 'lo-fi':
        return 'Lo-Fi';
      case 'nature':
        return 'Nature';
      case 'classical':
        return 'Classic';
      default:
        return 'Ambient'; // Default to ambient if preference doesn't match
    }
  }
  
  private shufflePlaylist(): void {
    // Fisher-Yates shuffle algorithm
    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
    }
  }
  
  public play(): void {
    if (!this.audioElement || this.playlist.length === 0) {
      console.log('No audio element or playlist is empty');
      return;
    }
    
    const track = this.getCurrentTrack();
    if (!track) return;
    
    // If we're already playing the current track, just resume
    if (this.audioElement.src && this.audioElement.src === track.url) {
      this.audioElement.play()
        .then(() => {
          this.isPlaying = true;
          this.notifyStateChange();
          this.fadeIn();
        })
        .catch(this.handleError.bind(this));
    } else {
      // Load and play a new track
      this.isLoading = true;
      this.notifyStateChange();
      
      this.audioElement.src = track.url;
      this.audioElement.volume = 0; // Start with volume at 0 for fade-in
      
      this.audioElement.play()
        .then(() => {
          this.isPlaying = true;
          this.fadeIn();
          this.notifyStateChange();
        })
        .catch(this.handleError.bind(this));
    }
  }
  
  public pause(): void {
    if (!this.audioElement) return;
    
    this.fadeOut(() => {
      if (this.audioElement) {
        this.audioElement.pause();
        this.isPlaying = false;
        this.notifyStateChange();
      }
    });
  }
  
  public playNext(): void {
    if (this.playlist.length === 0) return;
    
    // Increment the track index, wrapping around if necessary
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    
    // If we were already playing, play the new track
    if (this.isPlaying) {
      if (this.audioElement) {
        this.fadeOut(() => {
          this.play();
        });
      } else {
        this.play();
      }
    } else {
      this.notifyStateChange();
    }
  }
  
  public playPrevious(): void {
    if (this.playlist.length === 0) return;
    
    // Decrement the track index, wrapping around if necessary
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    
    // If we were already playing, play the new track
    if (this.isPlaying) {
      if (this.audioElement) {
        this.fadeOut(() => {
          this.play();
        });
      } else {
        this.play();
      }
    } else {
      this.notifyStateChange();
    }
  }
  
  public getCurrentTrack(): AudioTrack | null {
    return this.playlist.length > 0 ? this.playlist[this.currentTrackIndex] : null;
  }
  
  public setVolume(volume: number): void {
    if (!this.audioElement) return;
    
    // Ensure volume is between 0 and 1
    this.volume = Math.max(0, Math.min(1, volume));
    
    if (!this.muted) {
      this.audioElement.volume = this.volume;
    }
    
    this.notifyStateChange();
  }
  
  public toggleMute(): void {
    if (!this.audioElement) return;
    
    this.muted = !this.muted;
    this.audioElement.volume = this.muted ? 0 : this.volume;
    
    this.notifyStateChange();
  }
  
  public getState(): AudioPlayerState {
    return {
      isPlaying: this.isPlaying,
      volume: this.volume,
      currentTrack: this.getCurrentTrack(),
      playlist: this.playlist,
      muted: this.muted,
      loading: this.isLoading,
      error: null
    };
  }
  
  public cleanup(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.removeEventListener('ended', this.handleTrackEnded.bind(this));
      this.audioElement.removeEventListener('error', this.handleError.bind(this));
      this.audioElement.removeEventListener('canplaythrough', this.handleCanPlay.bind(this));
      this.audioElement = null;
    }
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    if (this.fadeOutTimeout) {
      window.clearTimeout(this.fadeOutTimeout);
    }
    
    if (this.fadeInTimeout) {
      window.clearTimeout(this.fadeInTimeout);
    }
  }
  
  private fadeIn(): void {
    if (!this.audioElement) return;
    
    if (this.fadeOutTimeout) {
      window.clearTimeout(this.fadeOutTimeout);
      this.fadeOutTimeout = null;
    }
    
    // Start from 0 volume and gradually increase
    let currentVolume = 0;
    const targetVolume = this.muted ? 0 : this.volume;
    const fadeStep = 0.05;
    const fadeDelay = 50;
    
    const fadeInStep = () => {
      if (!this.audioElement) return;
      
      currentVolume = Math.min(currentVolume + fadeStep, targetVolume);
      this.audioElement.volume = currentVolume;
      
      if (currentVolume < targetVolume) {
        this.fadeInTimeout = window.setTimeout(fadeInStep, fadeDelay);
      } else {
        this.fadeInTimeout = null;
      }
    };
    
    fadeInStep();
  }
  
  private fadeOut(callback: () => void): void {
    if (!this.audioElement) {
      callback();
      return;
    }
    
    if (this.fadeInTimeout) {
      window.clearTimeout(this.fadeInTimeout);
      this.fadeInTimeout = null;
    }
    
    // Start from current volume and gradually decrease
    let currentVolume = this.audioElement.volume;
    const fadeStep = 0.05;
    const fadeDelay = 50;
    
    const fadeOutStep = () => {
      if (!this.audioElement) {
        callback();
        return;
      }
      
      currentVolume = Math.max(currentVolume - fadeStep, 0);
      this.audioElement.volume = currentVolume;
      
      if (currentVolume > 0) {
        this.fadeOutTimeout = window.setTimeout(fadeOutStep, fadeDelay);
      } else {
        this.fadeOutTimeout = null;
        callback();
      }
    };
    
    fadeOutStep();
  }
}

export default AudioPlayerService;
