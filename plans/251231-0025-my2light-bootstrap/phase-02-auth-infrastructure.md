# Phase 2: Authentication & Core Infrastructure

## Context
- **Plan:** [plan.md](./plan.md)
- **Previous Phase:** [Phase 1: Foundation & Setup](./phase-01-foundation-setup.md)
- **Next Phase:** [Phase 3: Recording & Camera](./phase-03-recording-camera.md)
- **Dependencies:** Phase 1 complete (NativeWind, folder structure)

## Overview
| Field | Value |
|-------|-------|
| Date | 2025-12-31 |
| Priority | P1 |
| Status | Pending |
| Effort | 6h |

## Key Insights
- Supabase Auth supports Apple/Google OAuth natively
- expo-auth-session already in package.json
- Deep linking via `my2light://` scheme handles OAuth callbacks
- Zustand with MMKV persistence for auth state

## Requirements
1. Create Supabase project and configure OAuth providers
2. Setup Supabase client with environment variables
3. Implement auth store with Zustand
4. Create login screen with Apple/Google buttons
5. Handle OAuth redirects and session persistence
6. Protected route wrapper for authenticated screens

## Architecture Decisions

### ADR-004: Auth State Management
**Decision:** Zustand store with MMKV persistence
**Rationale:** Lightweight, TypeScript-friendly, instant hydration
**Consequences:** Need custom persist middleware for MMKV

### ADR-005: OAuth Flow
**Decision:** Supabase Auth with expo-auth-session
**Rationale:** Native OAuth experience, automatic token refresh
**Consequences:** Requires app scheme configuration

### ADR-006: Route Protection
**Decision:** Layout-based auth guards in Expo Router
**Rationale:** Declarative, prevents flicker, centralized logic
**Consequences:** Must handle loading states properly

## Related Code Files

### New Files to Create
```
src/
  lib/
    supabase.ts           # Supabase client initialization
    auth.ts               # Auth helper functions
  stores/
    authStore.ts          # Zustand auth state
  hooks/
    useAuth.ts            # Auth hook wrapper
  components/
    AuthGuard.tsx         # Protected route wrapper
    OAuthButton.tsx       # Apple/Google button
app/
  (auth)/
    _layout.tsx           # Auth layout
    login.tsx             # Login screen
  (tabs)/
    _layout.tsx           # Protected tab layout
.env.local                # Environment variables (gitignored)
```

### Files to Modify
- `.gitignore` - Add .env files

## Implementation Steps

### Step 1: Supabase Project Setup (30 min)
1. Create project at supabase.com
2. Enable Apple OAuth:
   - Apple Developer Console: Create App ID, Service ID, Key
   - Add callback URL: `https://<project>.supabase.co/auth/v1/callback`
3. Enable Google OAuth:
   - Google Cloud Console: Create OAuth credentials
   - Add authorized redirect: `https://<project>.supabase.co/auth/v1/callback`
4. Note project URL and anon key

### Step 2: Environment Setup (15 min)

**.env.local:**
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Update .gitignore:**
```
.env
.env.local
.env.*.local
```

### Step 3: Supabase Client (30 min)

**src/lib/supabase.ts:**
```typescript
import { createClient } from '@supabase/supabase-js';
import { storage, StorageKeys } from './storage';
import * as AuthSession from 'expo-auth-session';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

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
```

### Step 4: Auth Store (45 min)

**src/stores/authStore.ts:**
```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { storage } from '@/lib/storage';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: unknown) => {
    storage.set(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      signOut: () => set({ user: null, session: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### Step 5: Auth Helper Functions (30 min)

**src/lib/auth.ts:**
```typescript
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
```

### Step 6: Auth Hook (15 min)

**src/hooks/useAuth.ts:**
```typescript
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { setupAuthListener, getCurrentSession } from '@/lib/auth';

export function useAuth() {
  const { user, session, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Setup auth state listener
    const { data: { subscription } } = setupAuthListener();

    // Check for existing session
    getCurrentSession().then((session) => {
      if (session) {
        useAuthStore.getState().setSession(session);
        useAuthStore.getState().setUser(session.user);
      }
      useAuthStore.getState().setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, isLoading, isAuthenticated };
}
```

### Step 7: OAuth Button Component (30 min)

**src/components/OAuthButton.tsx:**
```typescript
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { signInWithOAuth } from '@/lib/auth';

interface OAuthButtonProps {
  provider: 'apple' | 'google';
  onError?: (error: Error) => void;
}

export function OAuthButton({ provider, onError }: OAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      await signInWithOAuth(provider);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const config = {
    apple: {
      icon: 'logo-apple' as const,
      label: 'Continue with Apple',
      bg: 'bg-white',
      text: 'text-black',
    },
    google: {
      icon: 'logo-google' as const,
      label: 'Continue with Google',
      bg: 'bg-surface',
      text: 'text-white',
    },
  };

  const { icon, label, bg, text } = config[provider];

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      className={`${bg} flex-row items-center justify-center py-4 px-6 rounded-xl`}
    >
      {loading ? (
        <ActivityIndicator color={provider === 'apple' ? '#000' : '#fff'} />
      ) : (
        <>
          <Ionicons name={icon} size={24} color={provider === 'apple' ? '#000' : '#fff'} />
          <Text className={`${text} text-lg font-semibold ml-3`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
```

### Step 8: Login Screen (45 min)

**app/(auth)/_layout.tsx:**
```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
```

**app/(auth)/login.tsx:**
```typescript
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { OAuthButton } from '@/components/OAuthButton';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-secondary">Loading...</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/gallery" />;
  }

  const handleError = (error: Error) => {
    Alert.alert('Sign In Failed', error.message);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center">
        {/* Logo/Header */}
        <View className="items-center mb-16">
          <Text className="text-4xl font-bold text-primary">My2Light</Text>
          <Text className="text-text-secondary mt-2">
            Capture your pickleball highlights
          </Text>
        </View>

        {/* OAuth Buttons */}
        <View className="gap-4">
          <OAuthButton provider="apple" onError={handleError} />
          <OAuthButton provider="google" onError={handleError} />
        </View>

        {/* Terms */}
        <Text className="text-text-secondary text-center text-xs mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

### Step 9: Protected Tab Layout (30 min)

**app/(tabs)/_layout.tsx:**
```typescript
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '@/lib/constants';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.surfaceElevated,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
      }}
    >
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="radio-button-on" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### Step 10: Root Layout Update (15 min)

**app/_layout.tsx:**
```typescript
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  // Initialize auth listener at root
  useAuth();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
```

## Todo List
- [ ] Create Supabase project
- [ ] Configure Apple OAuth in Supabase
- [ ] Configure Google OAuth in Supabase
- [ ] Create .env.local with keys
- [ ] Create src/lib/supabase.ts
- [ ] Create src/stores/authStore.ts
- [ ] Create src/lib/auth.ts
- [ ] Create src/hooks/useAuth.ts
- [ ] Create src/components/OAuthButton.tsx
- [ ] Create app/(auth)/_layout.tsx
- [ ] Create app/(auth)/login.tsx
- [ ] Create app/(tabs)/_layout.tsx
- [ ] Update app/_layout.tsx
- [ ] Test Apple OAuth flow
- [ ] Test Google OAuth flow
- [ ] Test session persistence

## Success Criteria
- [ ] Login screen renders with Apple/Google buttons
- [ ] OAuth redirects work on iOS and Android
- [ ] Session persists after app restart
- [ ] Protected tabs redirect to login when unauthenticated
- [ ] Sign out clears session and redirects to login

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OAuth redirect issues | Medium | High | Test on physical devices, verify scheme |
| Apple Sign-In rejection | Low | High | Follow Apple guidelines exactly |
| Token refresh failures | Low | Medium | Supabase handles automatically |

## Security Considerations
- Never commit .env files to git
- Anon key is safe for client (RLS protects data)
- Use HTTPS for all Supabase calls (default)
- Implement proper RLS policies in Supabase

## Next Steps
After completing Phase 2:
1. Proceed to [Phase 3: Recording & Camera](./phase-03-recording-camera.md)
2. Implement camera permissions
3. Build recording screen with highlight tagging
