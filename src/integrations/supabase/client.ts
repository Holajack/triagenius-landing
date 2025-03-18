import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

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
