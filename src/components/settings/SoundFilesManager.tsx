import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSoundFiles, SoundFile } from "@/hooks/use-sound-files";
import { SoundPreference } from "@/types/onboarding";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, Play, Pause, Plus, Upload, UploadCloud } from "lucide-react";
import { toast } from "sonner";

export const SoundFilesManager = () => {
  const { 
    soundFiles, 
    isLoading, 
    fetchSoundFiles,
    fetchSoundFilesByPreference, 
    uploadSoundFile, 
    getSoundFileUrl, 
    deleteSoundFile 
  } = useSoundFiles();
  
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [filter, setFilter] = useState<SoundPreference | 'all'>('all');
  const [audioPlayer] = useState(new Audio());

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [soundPreference, setSoundPreference] = useState<SoundPreference>("lo-fi");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.match('audio.*')) {
        toast.error('Please select an audio file');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    try {
      setUploadLoading(true);
      await uploadSoundFile(selectedFile, title, description, soundPreference);
      
      // Reset form
      setTitle("");
      setDescription("");
      setSoundPreference("lo-fi");
      setSelectedFile(null);
      setShowUploadForm(false);
      
      // If we're filtering, update the filtered results
      if (filter !== 'all') {
        await fetchSoundFilesByPreference(filter);
      } else {
        await fetchSoundFiles();
      }
      
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle audio playback
  const togglePlayback = (soundFile: SoundFile) => {
    const url = getSoundFileUrl(soundFile.file_path);
    
    if (currentlyPlaying === soundFile.id) {
      audioPlayer.pause();
      setCurrentlyPlaying(null);
    } else {
      // Stop current playback if any
      audioPlayer.pause();
      
      // Play the new audio
      audioPlayer.src = url;
      audioPlayer.onended = () => setCurrentlyPlaying(null);
      audioPlayer.play().catch(err => {
        console.error('Error playing audio:', err);
        toast.error('Failed to play audio file');
      });
      
      setCurrentlyPlaying(soundFile.id);
    }
  };

  // Handle filter change
  const handleFilterChange = async (value: string) => {
    const filterValue = value as SoundPreference | 'all';
    setFilter(filterValue);
    
    if (filterValue === 'all') {
      await fetchSoundFiles();
    } else {
      await fetchSoundFilesByPreference(filterValue);
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (filePath: string) => {
    if (window.confirm('Are you sure you want to delete this sound file?')) {
      // If file is currently playing, stop it
      const soundFile = soundFiles.find(file => file.file_path === filePath);
      if (soundFile && currentlyPlaying === soundFile.id) {
        audioPlayer.pause();
        setCurrentlyPlaying(null);
      }
      
      await deleteSoundFile(filePath);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Sound Files</CardTitle>
            <CardDescription>Manage sound files for focus sessions</CardDescription>
          </div>
          <Button 
            onClick={() => setShowUploadForm(!showUploadForm)}
            variant={showUploadForm ? "outline" : "default"}
            size="sm"
          >
            {showUploadForm ? "Cancel" : <><Plus className="h-4 w-4 mr-1" /> Add Sound</>}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Form */}
        {showUploadForm && (
          <div className="space-y-4 border rounded-md p-4 mb-4">
            <h3 className="font-medium">Upload New Sound</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="sound-category">Category</Label>
                <Select 
                  value={soundPreference} 
                  onValueChange={(value) => setSoundPreference(value as SoundPreference)}
                >
                  <SelectTrigger id="sound-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lo-fi">Lo-fi</SelectItem>
                    <SelectItem value="ambient">Nature/Ambient</SelectItem>
                    <SelectItem value="classical">Classical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="sound-file">Audio File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sound-file"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="flex-1"
                    required
                  />
                </div>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </p>
                )}
              </div>
              
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={uploadLoading || !selectedFile}>
                  {uploadLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Upload Sound
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
        
        {/* Filter */}
        <div className="flex justify-between items-center">
          <Label htmlFor="filter" className="text-sm font-medium">Filter by category:</Label>
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger id="filter" className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="lo-fi">Lo-fi</SelectItem>
              <SelectItem value="ambient">Nature/Ambient</SelectItem>
              <SelectItem value="classical">Classical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        {/* Sound Files List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : soundFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sound files found. Upload some to get started!
            </div>
          ) : (
            <div className="space-y-2">
              {soundFiles.map((soundFile) => (
                <div key={soundFile.id} className="border rounded-md p-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{soundFile.title}</h4>
                    {soundFile.description && (
                      <p className="text-sm text-muted-foreground">{soundFile.description}</p>
                    )}
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span className="capitalize bg-primary/10 px-2 py-0.5 rounded-full">{soundFile.sound_preference}</span>
                      <span>{new Date(soundFile.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePlayback(soundFile)}
                      title={currentlyPlaying === soundFile.id ? "Pause" : "Play"}
                    >
                      {currentlyPlaying === soundFile.id ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFile(soundFile.file_path)}
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
