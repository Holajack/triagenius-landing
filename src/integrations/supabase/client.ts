
import { createClient } from '@supabase/supabase-js';

// Use import.meta.env for Vite environment variables instead of process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Standardized error handling for Supabase operations
 * @param error The error returned from a Supabase operation
 * @returns A standardized error object with message and code
 */
export const handleSupabaseError = (error: any) => {
  console.error('Supabase operation error:', error);
  
  const errorMessage = error?.message || 'An unknown error occurred';
  const errorCode = error?.code || 'unknown_error';
  
  return {
    message: errorMessage,
    code: errorCode,
    original: error
  };
};
