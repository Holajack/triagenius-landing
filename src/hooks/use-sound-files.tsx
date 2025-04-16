
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
  const [soundLoading, setSoundLoading] = useState(false);
  const { user } = useUser();

  // Create music folder structure if it doesn't exist
  const ensureMusicFolders = useCallback(async () => {
    if (!user) return;
    
    try {
      // Create category folders if they don't exist
      const categories = ['Lo-Fi', 'Ambient', 'Nature', 'Classical'];
      
      for (const category of categories) {
        // We can't actually check if a folder exists in Supabase Storage
        // As a workaround, try to upload a 0-byte placeholder file to verify the folder
        const placeholderName = `.folder-marker`;
        const placeholderBlob = new Blob([''], { type: 'text/plain' });
        const placeholderFile = new File([placeholderBlob], placeholderName);
        
        try {
          await supabase.storage
            .from('music')
            .upload(`${category}/${placeholderName}`, placeholderFile, {
              cacheControl: '3600',
              upsert: true
            });
            
          console.log(`Created/verified music/${category} folder`);
        } catch (err) {
          console.log(`Error checking folder ${category}: `, err);
          // Continue anyway - the folder might already exist
        }
      }
    } catch (err) {
      console.error('Error ensuring music folders:', err);
    }
  }, [user]);

  // Fetch all sound files from Supabase storage
  const fetchSoundFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await ensureMusicFolders();
      
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
  }, [ensureMusicFolders]);

  // Add default sound files to database if none exist
  const addDefaultSoundFiles = async () => {
    if (!user) return;
    
    console.log('Adding default sound files');
    
    // Using real, playable audio files from free sources
    const defaultSounds = [
      {
        title: 'Lofi Study Beat',
        description: 'Relaxing lofi beat for studying',
        file_path: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Nul_Tiel_Records/Blank_Slate/Nul_Tiel_Records_-_Blank_Slate_-_01_Alone.mp3',
        file_type: 'audio/mp3',
        sound_preference: 'lo-fi',
        user_id: user.id
      },
      {
        title: 'Ambient Space',
        description: 'Ambient space sounds for focus',
        file_path: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/WFMU/Broke_For_Free/Directionless_EP/Broke_For_Free_-_01_-_Night_Owl.mp3',
        file_type: 'audio/mp3',
        sound_preference: 'ambient',
        user_id: user.id
      },
      {
        title: 'Forest Rain',
        description: 'Natural forest rain sounds',
        file_path: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_2dad9977f2.mp3',
        file_type: 'audio/mp3',
        sound_preference: 'nature',
        user_id: user.id
      },
      {
        title: 'Piano Sonata',
        description: 'Classical piano sonata',
        file_path: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0387cd084.mp3',
        file_type: 'audio/mp3',
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

  // Map preference categories to storage folder names
  const getStorageFolderForPreference = (preference: SoundPreference): string => {
    const storageMapping: Record<string, string> = {
      'lo-fi': 'Lo-Fi',
      'ambient': 'Ambient', 
      'nature': 'Nature',
      'classical': 'Classical'
    };
    
    return storageMapping[preference] || preference;
  };

  // Fetch sound files by preference category
  const fetchSoundFilesByPreference = useCallback(async (preference: SoundPreference) => {
    try {
      setIsLoading(true);
      setError(null);
      setSoundLoading(true);
      
      console.log(`Fetching sound files for preference: ${preference}`);
      
      if (preference === 'silence') {
        setSoundFiles([]);
        setSoundLoading(false);
        return [];
      }
      
      // Ensure folder structure exists
      await ensureMusicFolders();
      
      // First, try to fetch from the database specifically for this preference
      const { data: dbSoundFiles, error: dbError } = await supabase
        .from('sound_files')
        .select('*')
        .eq('sound_preference', preference);
        
      if (!dbError && dbSoundFiles && dbSoundFiles.length > 0) {
        console.log(`Found ${dbSoundFiles.length} files in database for ${preference}`);
        setSoundFiles(dbSoundFiles);
        setSoundLoading(false);
        return dbSoundFiles;
      }
      
      // If not found in database, try from storage
      // Get the storage folder name for this preference
      const storageFolder = getStorageFolderForPreference(preference);
      
      // Try to fetch from storage
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('music')
        .list(storageFolder, { sortBy: { column: 'name', order: 'asc' } });
        
      if (!storageError && storageFiles && storageFiles.length > 0) {
        console.log(`Found ${storageFiles.length} files in storage for ${preference} in folder ${storageFolder}`);
        
        // Filter to just get audio files and format them
        const soundFilesFromStorage = storageFiles
          .filter(file => file.name.endsWith('.mp3') || file.name.endsWith('.wav'))
          .map(file => ({
            id: `${storageFolder}/${file.name}`,
            title: file.name.replace(/\.(mp3|wav)$/i, '').replace(/_/g, ' '),
            description: `${preference} track`,
            file_path: `${storageFolder}/${file.name}`,
            file_type: file.name.endsWith('.mp3') ? 'audio/mp3' : 'audio/wav',
            sound_preference: preference,
            created_at: file.created_at || new Date().toISOString(),
            updated_at: file.updated_at || new Date().toISOString()
          }));
          
        if (soundFilesFromStorage.length > 0) {
          setSoundFiles(soundFilesFromStorage);
          setSoundLoading(false);
          return soundFilesFromStorage;
        }
      }
      
      // If no sound files found for this preference, use the default fallback
      console.log(`No sound files found for ${preference}, adding a default`);
      
      // Map each preference to a working audio file
      const defaultSoundMap: Record<string, {url: string, title: string}> = {
        'lo-fi': {
          url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Nul_Tiel_Records/Blank_Slate/Nul_Tiel_Records_-_Blank_Slate_-_01_Alone.mp3',
          title: 'Lofi Study Beat'
        },
        'ambient': {
          url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/WFMU/Broke_For_Free/Directionless_EP/Broke_For_Free_-_01_-_Night_Owl.mp3',
          title: 'Ambient Space'
        },
        'nature': {
          url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_2dad9977f2.mp3',
          title: 'Forest Rain'
        },
        'classical': {
          url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0387cd084.mp3',
          title: 'Piano Sonata'
        }
      };
      
      const soundInfo = defaultSoundMap[preference];
      const soundUrl = soundInfo?.url || defaultSoundMap['lo-fi'].url;
      const soundTitle = soundInfo?.title || `Default ${preference}`;
      
      const defaultFile = {
        title: soundTitle,
        description: `Default sound for ${preference} category`,
        file_path: soundUrl,
        file_type: 'audio/mp3',
        sound_preference: preference,
        user_id: user?.id
      };
      
      if (user && user.id) {
        const { data: newSound, error: insertError } = await supabase
          .from('sound_files')
          .insert(defaultFile)
          .select()
          .single();
          
        if (!insertError && newSound) {
          setSoundFiles([newSound]);
          console.log('Created default sound file:', newSound);
          setSoundLoading(false);
          return [newSound];
        }
      }
      
      // Fallback to public domain sounds without inserting to DB
      const fallbackSound = {
        id: `default-${preference}`,
        title: soundInfo?.title || `Default ${preference}`,
        description: `Default ${preference} sound`,
        file_path: soundInfo?.url || defaultSoundMap['lo-fi'].url,
        file_type: 'audio/mp3',
        sound_preference: preference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setSoundFiles([fallbackSound]);
      setSoundLoading(false);
      return [fallbackSound];
      
    } catch (err: any) {
      console.error('Error fetching sound files by preference:', err);
      setError(err.message);
      toast.error('Failed to load sound files');
      setSoundLoading(false);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, ensureMusicFolders]);

  // Get public URL for a sound file
  const getSoundFileUrl = useCallback((filePath: string) => {
    // If already a full URL, return it
    if (filePath.startsWith('http')) {
      console.log('Using direct URL:', filePath);
      return filePath;
    }
    
    // Get from Supabase storage with proper public URL
    const { data } = supabase.storage.from('music').getPublicUrl(filePath);
    console.log('Generated sound URL:', data.publicUrl, 'for path:', filePath);
    return data.publicUrl;
  }, []);

  // Save user's preferred sound to profile
  const savePreferredSound = async (preference: SoundPreference) => {
    if (!user || !user.id) return false;
    
    try {
      setSoundLoading(true);
      
      // Update profile with preferred sound
      const { error } = await supabase
        .from('profiles')
        .update({ 
          preferences: { sound_preference: preference }
        })
        .eq('id', user.id);
      
      if (error) {
        throw handleSupabaseError(error);
      }
      
      toast.success(`${preference} sounds will now play during focus sessions`);
      return true;
    } catch (err: any) {
      console.error('Error saving sound preference:', err);
      toast.error('Failed to save sound preference');
      return false;
    } finally {
      setSoundLoading(false);
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
      
      // Ensure the folders exist
      await ensureMusicFolders();
      
      // Get the proper folder for this preference
      const categoryFolder = getStorageFolderForPreference(soundPreference as SoundPreference);
      const filePath = `${categoryFolder}/${file.name}`;
      
      console.log(`Uploading file to ${filePath} in music bucket`);
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('music')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        throw handleSupabaseError(uploadError);
      }
      
      console.log('Upload successful:', uploadData);
      
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
    soundLoading,
    error,
    fetchSoundFiles,
    fetchSoundFilesByPreference,
    uploadSoundFile,
    getSoundFileUrl,
    deleteSoundFile,
    savePreferredSound
  };
};
