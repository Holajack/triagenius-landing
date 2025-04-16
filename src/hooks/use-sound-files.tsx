
import { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import { SoundPreference } from '@/types/onboarding';

export interface SoundFile {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_type: string;
  sound_preference: string;
  created_at: string;
  updated_at: string;
}

export const useSoundFiles = () => {
  const [soundFiles, setSoundFiles] = useState<SoundFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  // Fetch all sound files from Supabase storage
  const fetchSoundFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase.storage.from('music').list('', {
        limit: 100,
        offset: 0
      });
      
      if (error) throw handleSupabaseError(error);
      
      // Transform storage files into sound files
      const soundFilesList = data.map(file => ({
        id: file.name,
        title: file.name.split('.')[0],
        description: null,
        file_path: file.name,
        file_type: file.metadata?.mimetype || '',
        sound_preference: 'default', // You might want to extract this from file metadata or filename
        created_at: file.updated_at || new Date().toISOString(),
        updated_at: file.updated_at || new Date().toISOString()
      }));
      
      setSoundFiles(soundFilesList);
    } catch (err: any) {
      console.error('Error fetching sound files:', err);
      setError(err.message);
      toast.error('Failed to load sound files');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sound files by preference category
  const fetchSoundFilesByPreference = async (preference: SoundPreference) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase.storage.from('music').list(preference, {
        limit: 100,
        offset: 0
      });
      
      if (error) throw handleSupabaseError(error);
      
      // Transform storage files into sound files
      const soundFilesList = data.map(file => ({
        id: file.name,
        title: file.name.split('.')[0],
        description: null,
        file_path: `${preference}/${file.name}`,
        file_type: file.metadata?.mimetype || '',
        sound_preference: preference,
        created_at: file.updated_at || new Date().toISOString(),
        updated_at: file.updated_at || new Date().toISOString()
      }));
      
      setSoundFiles(soundFilesList);
    } catch (err: any) {
      console.error('Error fetching sound files by preference:', err);
      setError(err.message);
      toast.error('Failed to load sound files');
    } finally {
      setIsLoading(false);
    }
  };

  // Get public URL for a sound file
  const getSoundFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from('music').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Upload a sound file
  const uploadSoundFile = async (
    file: File, 
    title: string, 
    description: string, 
    soundPreference: string
  ) => {
    if (!user || !user.id) {
      toast.error('You must be logged in to upload sound files');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const filePath = `${soundPreference}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          metadata: {
            description: description,
            soundPreference: soundPreference,
            uploadedBy: user.id
          }
        });

      if (uploadError) throw handleSupabaseError(uploadError);

      toast.success('Sound file uploaded successfully');
      await fetchSoundFiles(); // Refresh the list
    } catch (err: any) {
      console.error('Error uploading sound file:', err);
      setError(err.message);
      toast.error('Failed to upload sound file');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a sound file
  const deleteSoundFile = async (filePath: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.storage
        .from('music')
        .remove([filePath]);

      if (error) throw handleSupabaseError(error);

      toast.success('Sound file deleted successfully');
      await fetchSoundFiles(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting sound file:', err);
      setError(err.message);
      toast.error('Failed to delete sound file');
    } finally {
      setIsLoading(false);
    }
  };

  // Load sound files on component mount
  useEffect(() => {
    fetchSoundFiles();
  }, []);

  return {
    soundFiles,
    isLoading,
    error,
    fetchSoundFiles,
    fetchSoundFilesByPreference,
    uploadSoundFile,
    getSoundFileUrl,
    deleteSoundFile
  };
};
