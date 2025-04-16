import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SoundFile } from "@/hooks/use-sound-files";
import { PlayIcon, PauseIcon, Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface MusicListProps {
  title?: string;
  soundFiles: SoundFile[];
  isLoading: boolean;
  currentlyPlaying: string | null;
  onPlayPause: (filePath: string) => void;
  soundLoading: boolean;
}

const MusicList = ({ 
  title = "Available Tracks", 
  soundFiles, 
  isLoading, 
  currentlyPlaying, 
  onPlayPause,
  soundLoading
}: MusicListProps) => {
  
  // Debugging logs
  console.log('MusicList rendering with:', {
    filesCount: soundFiles.length,
    currentlyPlaying,
    soundLoading
  });
  
  if (soundFiles.length > 0) {
    console.log('First sound file:', soundFiles[0]);
  }
  
  // Simplified component to just show category preview
  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (soundFiles.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No tracks available in this category.</p>
        </CardContent>
      </Card>
    );
  }

  // Just show the first track as representative of the category
  const representativeTrack = soundFiles[0];
  
  // Simplified check for if the track is playing
  const getIsPlaying = () => {
    if (!currentlyPlaying || !representativeTrack.file_path) return false;
    
    console.log("Checking if playing:", currentlyPlaying, representativeTrack.file_path);
    
    // Direct URL comparison - handles both ambient and classical direct URLs
    if (representativeTrack.sound_preference === 'ambient' || representativeTrack.sound_preference === 'classical') {
      return currentlyPlaying === representativeTrack.file_path;
    }
    
    // Direct match
    if (currentlyPlaying === representativeTrack.file_path) {
      return true;
    }
    
    // Check for URL match (Supabase storage URLs will contain the file_path)
    if (currentlyPlaying.includes(encodeURIComponent(representativeTrack.file_path)) ||
        currentlyPlaying.includes(representativeTrack.file_path)) {
      return true;
    }
    
    // For folder/file structure match
    const fileParts = representativeTrack.file_path.split('/');
    if (fileParts.length >= 2) {
      const folderName = fileParts[0];
      const fileName = fileParts[fileParts.length - 1];
      
      if (currentlyPlaying.includes(encodeURIComponent(folderName)) && 
          currentlyPlaying.includes(encodeURIComponent(fileName))) {
        return true;
      }
    }
    
    return false;
  };

  const isPlaying = getIsPlaying();

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex-1 mr-2">
            <div className="font-medium">{representativeTrack.title}</div>
            <p className="text-xs text-muted-foreground">
              {isPlaying ? "Playing preview..." : "Click to preview sound category"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              {representativeTrack.sound_preference}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                console.log('Play button clicked for:', representativeTrack.file_path);
                onPlayPause(representativeTrack.file_path);
              }}
              disabled={soundLoading}
            >
              {soundLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          When selected, this category will play continuously during focus sessions.
        </p>
      </CardContent>
    </Card>
  );
};

export default MusicList;
