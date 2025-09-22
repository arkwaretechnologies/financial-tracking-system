import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

let supabaseClient: any = null;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables. Using mock client for development.');
  // Create a mock client for development/testing
  supabaseClient = {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      eq: () => ({ single: () => ({ data: null, error: null }) }),
      order: () => ({ data: [], error: null }),
    }),
    auth: {
      signUp: () => ({ data: null, error: null }),
      signInWithPassword: () => ({ data: null, error: null }),
      signOut: () => ({ data: null, error: null }),
      getUser: () => ({ data: null, error: null }),
    }
  };
} else {
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
}

export const supabase = supabaseClient;
export default supabase;