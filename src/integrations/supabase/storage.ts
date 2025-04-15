
import { supabase } from './client';

/**
 * Initializes the Supabase storage buckets and creates them if they don't exist
 */
export async function initializeStorageBuckets() {
  try {
    // Check if music_files bucket exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error checking storage buckets:', listError);
      return;
    }
    
    const musicFilesBucketExists = existingBuckets.some(bucket => bucket.name === 'music_files');
    
    if (!musicFilesBucketExists) {
      // Create the music_files bucket with public access
      const { error: createError } = await supabase.storage.createBucket('music_files', {
        public: true,
        fileSizeLimit: 50000000, // 50MB limit
      });
      
      if (createError) {
        console.error('Error creating music_files bucket:', createError);
        return;
      }
      
      console.log('Created music_files bucket');
      
      // Create the necessary folders in the music_files bucket
      const folders = ['Ambient', 'Lo-Fi', 'Nature', 'Classic'];
      
      for (const folder of folders) {
        // Creating an empty file in the folder to create the folder
        const { error: folderError } = await supabase.storage
          .from('music_files')
          .upload(`${folder}/.keep`, new File([''], '.keep', { type: 'text/plain' }));
          
        if (folderError && folderError.message !== 'The resource already exists') {
          console.error(`Error creating ${folder} folder:`, folderError);
        } else {
          console.log(`Created ${folder} folder in music_files bucket`);
        }
      }
    }
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
  }
}

/**
 * Gets a signed URL for a file in storage
 */
export async function getFileUrl(bucketName: string, filePath: string) {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
    
  return data.publicUrl;
}
