import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase, getRedirectUri } from './supabase';
import { useAuthStore } from '@/stores/authStore';

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'apple' | 'google';

export async function signInWithOAuth(provider: OAuthProvider) {
  const redirectUri = getRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectUri
  );

  if (result.type === 'success') {
    const url = new URL(result.url);
    const params = new URLSearchParams(url.hash.slice(1));

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      // Validate token format (JWT should have 3 parts: header.payload.signature)
      const isValidJWT = (token: string) => {
        const parts = token.split('.');
        return parts.length === 3 && parts.every(part => part.length > 0);
      };

      if (!isValidJWT(accessToken) || !isValidJWT(refreshToken)) {
        throw new Error('Invalid token format received from OAuth provider');
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

      if (sessionError) throw sessionError;
      return sessionData;
    }
  }

  return null;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  useAuthStore.getState().signOut();
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export function setupAuthListener() {
  return supabase.auth.onAuthStateChange((event, session) => {
    const { setUser, setSession, setLoading } = useAuthStore.getState();

    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });
}
