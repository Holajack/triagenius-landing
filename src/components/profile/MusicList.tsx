
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
}

const MusicList = ({ 
  title = "Available Tracks", 
  soundFiles, 
  isLoading, 
  currentlyPlaying, 
  onPlayPause 
}: MusicListProps) => {
  
  const getFileName = (path: string) => {
    if (path.startsWith('http')) {
      const parts = path.split('/');
      return parts[parts.length - 1].split('?')[0];
    }
    return path;
  };

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

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {soundFiles.map((file) => (
            <li key={file.id} className="flex items-center justify-between border-b pb-2">
              <div className="flex-1 mr-2">
                <div className="font-medium">{file.title}</div>
                {file.description && (
                  <p className="text-xs text-muted-foreground">{file.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  {file.sound_preference}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPlayPause(file.file_path)}
                >
                  {currentlyPlaying === file.file_path ? (
                    <PauseIcon className="h-4 w-4" />
                  ) : (
                    <PlayIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default MusicList;
