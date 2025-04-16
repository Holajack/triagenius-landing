
import { useState, useEffect, useCallback } from 'react';
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
  const fetchSoundFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First try to fetch from the sound_files database table
      const { data: dbSoundFiles, error: dbError } = await supabase
        .from('sound_files')
        .select('*');
      
      if (!dbError && dbSoundFiles && dbSoundFiles.length > 0) {
        console.log('Found sound files in database:', dbSoundFiles);
        setSoundFiles(dbSoundFiles);
        return dbSoundFiles;
      }
      
      // If no records in database, try storage
      console.log('No sound files found in database, checking storage');
      const { data: storageFiles, error: storageError } = await supabase.storage.from('music').list('', {
        limit: 100,
        offset: 0
      });
      
      if (storageError) throw handleSupabaseError(storageError);
      
      if (!storageFiles || storageFiles.length === 0) {
        console.log('No sound files found in storage');
        // Add default sound files if none exist
        await addDefaultSoundFiles();
        return [];
      }
      
      // Transform storage files into sound files
      const soundFilesList = storageFiles.map(file => ({
        id: file.name,
        title: file.name.split('.')[0],
        description: null,
        file_path: file.name,
        file_type: file.metadata?.mimetype || '',
        sound_preference: 'default',
        created_at: file.updated_at || new Date().toISOString(),
        updated_at: file.updated_at || new Date().toISOString()
      }));
      
      setSoundFiles(soundFilesList);
      return soundFilesList;
    } catch (err: any) {
      console.error('Error fetching sound files:', err);
      setError(err.message);
      toast.error('Failed to load sound files');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add default sound files to database if none exist
  const addDefaultSoundFiles = async () => {
    if (!user) return;
    
    console.log('Adding default sound files');
    
    // Using real, public domain audio files that actually work
    const defaultSounds = [
      {
        title: 'Lofi Study Beat',
        description: 'Relaxing lofi beat for studying',
        file_path: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
        file_type: 'audio/ogg',
        sound_preference: 'lo-fi',
        user_id: user.id
      },
      {
        title: 'Ambient Space',
        description: 'Ambient space sounds for focus',
        file_path: 'https://actions.google.com/sounds/v1/ambiences/ambient_hum.ogg',
        file_type: 'audio/ogg',
        sound_preference: 'ambient',
        user_id: user.id
      },
      {
        title: 'Forest Rain',
        description: 'Natural forest rain sounds',
        file_path: 'https://actions.google.com/sounds/v1/nature/forest_ambience.ogg',
        file_type: 'audio/ogg',
        sound_preference: 'nature',
        user_id: user.id
      },
      {
        title: 'Piano Sonata',
        description: 'Classical piano sonata',
        file_path: 'https://actions.google.com/sounds/v1/musical_instruments/piano_resonance_notes.ogg',
        file_type: 'audio/ogg',
        sound_preference: 'classical',
        user_id: user.id
      }
    ];
    
    try {
      const { error } = await supabase
        .from('sound_files')
        .insert(defaultSounds);
      
      if (error) throw handleSupabaseError(error);
      
      console.log('Default sound files added successfully');
    } catch (err) {
      console.error('Error adding default sound files:', err);
    }
  };

  // Fetch sound files by preference category
  const fetchSoundFilesByPreference = useCallback(async (preference: SoundPreference) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Fetching sound files for preference: ${preference}`);
      
      // First try to get from database by preference
      const { data: dbSoundFiles, error: dbError } = await supabase
        .from('sound_files')
        .select('*')
        .eq('sound_preference', preference);
        
      if (!dbError && dbSoundFiles && dbSoundFiles.length > 0) {
        console.log(`Found ${dbSoundFiles.length} files in database for ${preference}`);
        setSoundFiles(dbSoundFiles);
        return dbSoundFiles;
      }
      
      // If none found in database, create a default one
      if (preference !== 'silence') {
        console.log(`No sound files found for ${preference}, adding a default`);
        
        // Add default sound file for this preference if user is logged in
        if (user && user.id) {
          // Map each preference to a specific Google Sound Library file that actually works
          const defaultSoundMap: Record<string, string> = {
            'lo-fi': 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
            'ambient': 'https://actions.google.com/sounds/v1/ambiences/ambient_hum.ogg',
            'nature': 'https://actions.google.com/sounds/v1/water/forest_stream.ogg',
            'classical': 'https://actions.google.com/sounds/v1/musical_instruments/piano_resonance_notes.ogg'
          };
          
          const soundUrl = defaultSoundMap[preference] || 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg';
          
          const defaultFile = {
            title: `Default ${preference} sound`,
            description: `Default sound for ${preference} category`,
            file_path: soundUrl,
            file_type: 'audio/ogg',
            sound_preference: preference,
            user_id: user.id
          };
          
          const { data: newSound, error: insertError } = await supabase
            .from('sound_files')
            .insert(defaultFile)
            .select()
            .single();
            
          if (!insertError && newSound) {
            setSoundFiles([newSound]);
            console.log('Created default sound file:', newSound);
            return [newSound];
          }
        }
        
        // Fallback to public domain sounds
        const fallbackSoundMap: Record<string, string> = {
          'lo-fi': 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
          'ambient': 'https://actions.google.com/sounds/v1/ambiences/ambient_hum.ogg',
          'nature': 'https://actions.google.com/sounds/v1/water/forest_stream.ogg',
          'classical': 'https://actions.google.com/sounds/v1/musical_instruments/piano_resonance_notes.ogg'
        };
        
        const fallbackSound = {
          id: `default-${preference}`,
          title: `Default ${preference}`,
          description: `Default ${preference} sound`,
          file_path: fallbackSoundMap[preference] || 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
          file_type: 'audio/ogg',
          sound_preference: preference,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setSoundFiles([fallbackSound]);
        return [fallbackSound];
      } else {
        // For silence, return empty array
        setSoundFiles([]);
        return [];
      }
    } catch (err: any) {
      console.error('Error fetching sound files by preference:', err);
      setError(err.message);
      toast.error('Failed to load sound files');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Get public URL for a sound file
  const getSoundFileUrl = useCallback((filePath: string) => {
    console.log(`Getting URL for file path: ${filePath}`);
    
    // If already a full URL, return it
    if (filePath.startsWith('http')) {
      console.log(`File is already a URL: ${filePath}`);
      return filePath;
    }
    
    // Otherwise get from storage
    const { data } = supabase.storage.from('music').getPublicUrl(filePath);
    console.log(`Generated URL: ${data.publicUrl}`);
    return data.publicUrl;
  }, []);

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
      
      // Also add to database
      const { error: dbError } = await supabase
        .from('sound_files')
        .insert({
          title: title,
          description: description,
          file_path: filePath,
          file_type: file.type,
          sound_preference: soundPreference,
          user_id: user.id
        });
      
      if (dbError) throw handleSupabaseError(dbError);

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

      // If it's a URL, it's a default sound
      if (filePath.startsWith('http')) {
        // Just remove from database if it exists
        const { error } = await supabase
          .from('sound_files')
          .delete()
          .eq('file_path', filePath);
          
        if (error) throw handleSupabaseError(error);
      } else {
        // Delete from storage
        const { error } = await supabase.storage
          .from('music')
          .remove([filePath]);

        if (error) throw handleSupabaseError(error);
        
        // Also delete from database
        await supabase
          .from('sound_files')
          .delete()
          .eq('file_path', filePath);
      }

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
  }, [fetchSoundFiles]);

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
