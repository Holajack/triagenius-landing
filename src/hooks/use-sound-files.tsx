
import { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';

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

  // Fetch all sound files
  const fetchSoundFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('sound_files')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw handleSupabaseError(error);
      
      setSoundFiles(data || []);
    } catch (err: any) {
      console.error('Error fetching sound files:', err);
      setError(err.message);
      toast.error('Failed to load sound files');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sound files by preference
  const fetchSoundFilesByPreference = async (preference: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('sound_files')
        .select('*')
        .eq('sound_preference', preference)
        .order('created_at', { ascending: false });
      
      if (error) throw handleSupabaseError(error);
      
      setSoundFiles(data || []);
    } catch (err: any) {
      console.error('Error fetching sound files by preference:', err);
      setError(err.message);
      toast.error('Failed to load sound files');
    } finally {
      setIsLoading(false);
    }
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

      // First upload the file to storage
      const filePath = `${soundPreference}/${Date.now()}_${file.name}`;
      const { error: uploadError, data } = await supabase.storage
        .from('music_files')
        .upload(filePath, file);

      if (uploadError) throw handleSupabaseError(uploadError);

      // Then create a record in the sound_files table
      const { error: insertError } = await supabase
        .from('sound_files')
        .insert({
          title,
          description,
          file_path: filePath,
          file_type: file.type,
          sound_preference: soundPreference,
          user_id: user.id // Add the user_id field which was missing
        });

      if (insertError) throw handleSupabaseError(insertError);

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

  // Get public URL for a sound file
  const getSoundFileUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('music_files')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  // Delete a sound file
  const deleteSoundFile = async (id: string, filePath: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Delete the record from the database
      const { error: deleteRecordError } = await supabase
        .from('sound_files')
        .delete()
        .eq('id', id);

      if (deleteRecordError) throw handleSupabaseError(deleteRecordError);

      // Delete the file from storage
      const { error: deleteFileError } = await supabase.storage
        .from('music_files')
        .remove([filePath]);

      if (deleteFileError) throw handleSupabaseError(deleteFileError);

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
