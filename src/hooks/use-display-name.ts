
import { UserProfile } from "@/types/database";

/**
 * Helper function to get the display name for a user based on their preference
 * 
 * @param profile The user profile object
 * @returns The appropriate display name based on user preference
 */
export const getDisplayName = (profile: Partial<UserProfile> | null): string => {
  if (!profile) return 'Unknown User';
  
  // If preference is full_name and full_name exists, use it
  if (
    profile.display_name_preference === 'full_name' && 
    profile.full_name && 
    profile.full_name.trim() !== ''
  ) {
    return profile.full_name;
  }
  
  // Default to username
  return profile.username || 'Unknown User';
};

/**
 * Hook to get a function for retrieving a user's display name based on preferences
 */
export const useDisplayName = () => {
  return {
    getDisplayName
  };
};
