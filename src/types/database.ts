
// Custom database types that extend Supabase types
// This file is used to define types for our database that we can use throughout the app

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface UserTask {
  id: string;
  user_id: string;
  subject_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  preferences?: Record<string, any> | null;
  privacy_settings?: Record<string, any> | null;
  university?: string | null;
  state?: string | null;
  major?: string | null;
  profession?: string | null;
  business?: string | null;
  show_university?: boolean;
  show_state?: boolean;
  show_business?: boolean;
  show_classes?: boolean;
  classes?: string[] | null;
  created_at: string;
  updated_at: string;
}

// Helper function to handle Supabase errors with proper typing
export const handleDbError = (error: any, message = 'Database operation failed'): Error => {
  console.error(`${message}:`, error);
  return new Error(`${message}: ${error?.message || 'Unknown error'}`);
};
