
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
 * Gets the full display information for a user, including display name and original name
 * Used for tooltips and detailed displays
 */
export const getUserDisplayInfo = (profile: Partial<UserProfile> | null): {
  displayName: string;
  originalName: string | null;
  hasCustomName: boolean;
} => {
  if (!profile) {
    return {
      displayName: 'Unknown User',
      originalName: null,
      hasCustomName: false
    };
  }

  const displayName = getDisplayName(profile);
  let originalName = null;
  let hasCustomName = false;
  
  // If using full_name as display, provide username as original
  if (profile.display_name_preference === 'full_name' && profile.username) {
    originalName = profile.username;
    hasCustomName = true;
  } 
  // If using username as display, provide full_name as original if it exists
  else if (profile.display_name_preference === 'username' && profile.full_name) {
    originalName = profile.full_name;
    hasCustomName = true;
  }

  return {
    displayName,
    originalName,
    hasCustomName
  };
};

/**
 * Generate initials from a display name
 * Used for avatar fallbacks
 */
export const getInitials = (displayName: string): string => {
  if (!displayName) return '?';
  
  const parts = displayName.split(' ');
  if (parts.length === 1) {
    return displayName.charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Hook to get functions for retrieving user display information
 */
export const useDisplayName = () => {
  return {
    getDisplayName,
    getUserDisplayInfo,
    getInitials
  };
};
