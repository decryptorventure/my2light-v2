import { createClient } from '@supabase/supabase-js';
import { storage } from './storage';
import * as AuthSession from 'expo-auth-session';

// Validate environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Please create a .env.local file with:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=your-project-url\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    'See .env.example for reference.'
  );
}

// Custom storage adapter for Supabase using MMKV
const mmkvStorageAdapter = {
  getItem: (key: string) => {
    const value = storage.getString(key);
    return value ?? null;
  },
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: mmkvStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const getRedirectUri = () => {
  return AuthSession.makeRedirectUri({
    scheme: 'my2light',
    path: 'auth/callback',
  });
};
