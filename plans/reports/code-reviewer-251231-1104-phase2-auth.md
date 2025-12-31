# Code Review: Phase 2 Auth & Infrastructure

## Code Review Summary

### Scope
- **Files reviewed:** 11 core files + 3 supporting files
- **Lines analyzed:** ~500 LOC
- **Focus:** Phase 2 auth implementation (Supabase OAuth, Zustand state, routing)
- **TypeScript check:** Passed with no errors
- **Plan updated:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/plans/251231-0025-my2light-bootstrap/phase-02-auth-infrastructure.md`

### Overall Assessment
**Rating: B+ (Good with critical fixes needed)**

Implementation follows solid React Native/Expo patterns with proper TypeScript usage. Auth flow architecture is sound using Supabase + Zustand + MMKV. However, several **critical security and error handling issues** must be addressed before production.

Key strengths:
- Clean separation of concerns (lib/stores/hooks/components)
- TypeScript strict mode compliance
- Proper MMKV persistence integration
- Auth state listener pattern correct

Key weaknesses:
- Multiple auth initialization points causing race conditions
- Missing error handling in critical paths
- Token parsing vulnerability
- Navigation loop potential
- Non-native tab icons (React on RN)

---

## Critical Issues (MUST FIX)

### 1. **CRITICAL: Double Auth Initialization Race Condition**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/hooks/useAuth.ts` + `/Users/tommac/Desktop/Solo Builder/my2light-v2/app/_layout.tsx`

**Issue:**
```typescript
// app/_layout.tsx line 9
const { isAuthenticated, isLoading } = useAuth();

// src/hooks/useAuth.ts lines 8-23
useEffect(() => {
  const { data: { subscription } } = setupAuthListener();
  getCurrentSession().then((session) => {
    // ... setup
  });
  return () => subscription.unsubscribe();
}, []);
```

Auth listener setup occurs in EVERY component that calls `useAuth()`. Both `app/_layout.tsx` AND `app/(tabs)/_layout.tsx` call it, creating:
- Duplicate auth listeners
- Race conditions on session loading
- Potential multiple network calls
- Unpredictable `isLoading` state

**Impact:** Users may see auth flicker, double redirects, or login loops.

**Fix:**
1. Move auth initialization to root layout ONLY
2. Hook should ONLY read state, not initialize
3. Use ref to ensure single listener setup

```typescript
// app/_layout.tsx - ONLY place to init
export default function RootLayout() {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const { data: { subscription } } = setupAuthListener();
    getCurrentSession().then((session) => {
      if (session) {
        useAuthStore.getState().setSession(session);
        useAuthStore.getState().setUser(session.user);
      }
      useAuthStore.getState().setLoading(false);
    }).catch(err => {
      console.error('Session init error:', err);
      useAuthStore.getState().setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ... rest
}

// src/hooks/useAuth.ts - READ ONLY
export function useAuth() {
  return useAuthStore((state) => ({
    user: state.user,
    session: state.session,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
  }));
}
```

---

### 2. **CRITICAL: Missing Error Handling in Auth Hook**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/hooks/useAuth.ts` line 13

**Issue:**
```typescript
getCurrentSession().then((session) => {
  // ... no .catch() handler
});
```

Network failures, token expiry, or Supabase errors will crash silently. User stuck on loading spinner.

**Fix:**
```typescript
getCurrentSession()
  .then((session) => {
    if (session) {
      useAuthStore.getState().setSession(session);
      useAuthStore.getState().setUser(session.user);
    }
    useAuthStore.getState().setLoading(false);
  })
  .catch((error) => {
    console.error('Failed to restore session:', error);
    // Clear potentially corrupted session
    useAuthStore.getState().signOut();
    useAuthStore.getState().setLoading(false);
  });
```

---

### 3. **CRITICAL: URL Hash Parsing Vulnerability**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/lib/auth.ts` lines 30-41

**Issue:**
```typescript
const url = new URL(result.url);
const params = new URLSearchParams(url.hash.slice(1));

const accessToken = params.get('access_token');
const refreshToken = params.get('refresh_token');

if (accessToken && refreshToken) {
  // No validation of token format
```

No validation that tokens are well-formed. Malicious redirect could inject invalid tokens, causing:
- Session corruption
- Zustand store persistence of bad data
- Difficult-to-debug auth failures

**Fix:**
```typescript
if (result.type === 'success') {
  const url = new URL(result.url);

  // Handle both hash and query params (Supabase uses hash)
  const hashParams = new URLSearchParams(url.hash.slice(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  // Validate token format (JWT)
  if (accessToken && refreshToken &&
      accessToken.split('.').length === 3 &&
      refreshToken.length > 0) {

    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

    if (sessionError) throw sessionError;
    return sessionData;
  } else {
    throw new Error('Invalid OAuth tokens received');
  }
}
```

---

### 4. **CRITICAL: Navigation Loop Potential**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/app/_layout.tsx` lines 13-25

**Issue:**
```typescript
useEffect(() => {
  if (isLoading) return;

  const inAuthGroup = segments[0] === '(auth)';

  if (!isAuthenticated && !inAuthGroup) {
    router.replace('/(auth)/login'); // Can loop if login page doesn't load
  } else if (isAuthenticated && inAuthGroup) {
    router.replace('/(tabs)/gallery'); // Can loop if tabs unmount
  }
}, [isAuthenticated, isLoading, segments, router]); // router in deps!
```

`router` object in deps array causes re-run on every render. If navigation fails, infinite loop possible.

**Fix:**
```typescript
const hasNavigated = useRef(false);

useEffect(() => {
  if (isLoading || hasNavigated.current) return;

  const inAuthGroup = segments[0] === '(auth)';

  if (!isAuthenticated && !inAuthGroup) {
    hasNavigated.current = true;
    router.replace('/(auth)/login');
  } else if (isAuthenticated && inAuthGroup) {
    hasNavigated.current = true;
    router.replace('/(tabs)/gallery');
  }
}, [isAuthenticated, isLoading, segments]);

// Reset on auth state change
useEffect(() => {
  hasNavigated.current = false;
}, [isAuthenticated]);
```

---

### 5. **CRITICAL: Environment Variable Runtime Check Missing**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/lib/supabase.ts` lines 5-6

**Issue:**
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

Using `!` assertion without validation. If env vars missing, app crashes at runtime with cryptic error.

**Fix:**
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Ensure EXPO_PUBLIC_SUPABASE_URL and ' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // ...
});
```

---

## High Priority Warnings

### 6. **Storage Adapter Error Handling**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/stores/authStore.ts` lines 18-29

**Issue:**
```typescript
const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null; // No try/catch
  },
  setItem: (name: string, value: unknown) => {
    storage.set(name, JSON.stringify(value)); // No try/catch
  },
  // ...
};
```

Corrupted MMKV data will crash app on hydration. JSON.parse failure unhandled.

**Fix:**
```typescript
const mmkvStorage = {
  getItem: (name: string) => {
    try {
      const value = storage.getString(name);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to parse auth storage for "${name}":`, error);
      // Clear corrupted data
      storage.delete(name);
      return null;
    }
  },
  setItem: (name: string, value: unknown) => {
    try {
      storage.set(name, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save auth state for "${name}":`, error);
      // Don't throw - allow app to continue with in-memory state
    }
  },
  removeItem: (name: string) => {
    try {
      storage.delete(name);
    } catch (error) {
      console.error(`Failed to delete "${name}":`, error);
    }
  },
};
```

---

### 7. **Sign Out Error Not Surfaced**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/app/(tabs)/gallery.tsx` lines 10-16

**Issue:**
```typescript
const handleSignOut = async () => {
  try {
    await signOut();
    router.replace('/(auth)/login');
  } catch (error) {
    console.error('Sign out error:', error); // Only logged
  }
};
```

Network failure during sign out leaves user in limbo. Store clears but server session persists.

**Fix:**
```typescript
const handleSignOut = async () => {
  try {
    await signOut();
    router.replace('/(auth)/login');
  } catch (error) {
    console.error('Sign out error:', error);
    Alert.alert(
      'Sign Out Failed',
      'Could not sign out. Please check your connection and try again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: handleSignOut },
      ]
    );
  }
};
```

---

### 8. **Tab Bar Icons Use React (Non-Native)**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/app/(tabs)/_layout.tsx` lines 36, 43

**Issue:**
```typescript
tabBarIcon: ({ color }) => <span style={{ fontSize: 24 }}>🎬</span>
```

Using HTML `<span>` in React Native. This will NOT work on iOS/Android. Only works in web dev mode.

**Fix:**
```typescript
import { Ionicons } from '@expo/vector-icons';

// ...

<Tabs.Screen
  name="gallery"
  options={{
    title: 'Gallery',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="film-outline" size={size} color={color} />
    ),
  }}
/>
<Tabs.Screen
  name="record"
  options={{
    title: 'Record',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="videocam-outline" size={size} color={color} />
    ),
  }}
/>
```

---

### 9. **OAuth Success Callback Not Awaited**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/components/OAuthButton.tsx` lines 35-38

**Issue:**
```typescript
const result = await signInWithOAuth(provider);

if (result) {
  onSuccess?.(); // Called before state updates propagate
} else {
  throw new Error('Authentication cancelled or failed');
}
```

`onSuccess` callback fires immediately. Zustand state/router may not be updated yet, causing:
- Navigation to protected route before `isAuthenticated` updates
- Auth guard redirects back to login
- User sees flash of wrong screen

**Fix:**
```typescript
const result = await signInWithOAuth(provider);

if (result) {
  // Wait for state to propagate (Zustand is synchronous but router needs tick)
  await new Promise(resolve => setTimeout(resolve, 100));
  onSuccess?.();
} else {
  throw new Error('Authentication cancelled or failed');
}
```

OR better, rely on auth listener in root layout to handle navigation automatically:
```typescript
// Remove onSuccess navigation from login.tsx
// Let root layout handle routing based on isAuthenticated
```

---

### 10. **Missing Session Error Handling in Auth Listener**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/lib/auth.ts` lines 63-71

**Issue:**
```typescript
export function setupAuthListener() {
  return supabase.auth.onAuthStateChange((event, session) => {
    const { setUser, setSession, setLoading } = useAuthStore.getState();

    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });
}
```

No error event handling. Auth events can fail (e.g., `TOKEN_REFRESHED` error, `SIGNED_OUT` due to server-side revocation).

**Fix:**
```typescript
export function setupAuthListener() {
  return supabase.auth.onAuthStateChange((event, session) => {
    const { setUser, setSession, setLoading } = useAuthStore.getState();

    console.log('Auth event:', event); // Debug logging

    // Handle error events
    if (event === 'TOKEN_REFRESHED' && !session) {
      console.warn('Token refresh failed - signing out');
      useAuthStore.getState().signOut();
    } else if (event === 'SIGNED_OUT') {
      setSession(null);
      setUser(null);
    } else {
      setSession(session);
      setUser(session?.user ?? null);
    }

    setLoading(false);
  });
}
```

---

## Medium Priority Improvements

### 11. **Redundant Auth Check in Login Screen**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/app/(auth)/login.tsx` lines 6-12

Root layout already handles auth routing. Login screen check is redundant and causes double render.

**Suggestion:** Remove check from login screen, rely on root layout guard.

---

### 12. **Missing Type Export**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/lib/auth.ts` line 8

```typescript
type OAuthProvider = 'apple' | 'google';
```

Should be exported for reuse. Currently duplicated in `OAuthButton.tsx` line 5.

**Fix:**
```typescript
export type OAuthProvider = 'apple' | 'google';
```

---

### 13. **Hard-coded Colors in Tab Layout**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/app/(tabs)/_layout.tsx` lines 24-29

```typescript
backgroundColor: '#1C1C1E',
borderTopColor: '#2C2C2E',
```

Phase 1 setup uses Tailwind color system. Should use theme constants.

**Fix:**
```typescript
import { COLORS } from '@/lib/constants'; // Assuming exists from Phase 1

tabBarStyle: {
  backgroundColor: COLORS.surface,
  borderTopColor: COLORS.border,
},
tabBarActiveTintColor: COLORS.primary,
tabBarInactiveTintColor: COLORS.textSecondary,
```

---

### 14. **Storage Fallback Class Missing Methods**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/lib/storage.ts` lines 3-15

Mock class for dev doesn't match MMKV API. Will cause errors if used.

**Fix:**
```typescript
MMKV = class {
  constructor(config?: any) {}
  getString(key: string): string | undefined { return undefined; }
  set(key: string, value: string): void {}
  delete(key: string): void {}
  clearAll(): void {}
  getAllKeys(): string[] { return []; }
};
```

---

### 15. **Missing Accessibility Labels**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/components/OAuthButton.tsx`

TouchableOpacity missing `accessibilityRole` and `accessibilityLabel`.

**Fix:**
```typescript
<TouchableOpacity
  onPress={handlePress}
  disabled={isLoading}
  accessibilityRole="button"
  accessibilityLabel={`Sign in with ${provider === 'apple' ? 'Apple' : 'Google'}`}
  accessibilityState={{ disabled: isLoading }}
  // ...
>
```

---

### 16. **Loading State Not Returned from useAuth**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/app/(tabs)/_layout.tsx` lines 15-17

```typescript
if (isLoading || !isAuthenticated) {
  return null; // Shows blank screen
}
```

Better UX to show loading spinner during auth check.

**Fix:**
```typescript
if (isLoading) {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#FF3B30" />
    </View>
  );
}

if (!isAuthenticated) {
  return null; // Let root layout redirect
}
```

---

## Low Priority Suggestions

### 17. **Unused Import**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/lib/storage.ts` line 22

`StorageKeys.AUTH_TOKEN` and `StorageKeys.USER_ID` defined but never used. Zustand handles keys.

**Suggestion:** Remove or mark as reserved for future use.

---

### 18. **Console.log in Production**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/components/OAuthButton.tsx` line 44

```typescript
console.error(`OAuth ${provider} error:`, err);
```

Should use proper error tracking service (Sentry) for production.

**Suggestion:** Add conditional logging or integrate error tracking.

---

### 19. **Magic String for Redirect Path**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/lib/supabase.ts` line 34

```typescript
path: 'auth/callback',
```

Should be constant or config value.

**Fix:**
```typescript
const AUTH_REDIRECT_PATH = 'auth/callback';

export const getRedirectUri = () => {
  return AuthSession.makeRedirectUri({
    scheme: 'my2light',
    path: AUTH_REDIRECT_PATH,
  });
};
```

---

### 20. **Emoji Icons Not Accessible**
**Location:** `/Users/tommac/Desktop/Solo Builder/my2light-v2/src/components/OAuthButton.tsx` lines 15-16

```typescript
icon: '🍎',
icon: '🔵',
```

Screen readers announce as "red apple" and "blue circle". Not helpful for blind users.

**Fix:** Use proper icon library or add `accessibilityLabel` override.

---

## Positive Observations

1. **Excellent TypeScript Usage**: Strict mode enabled, proper typing throughout
2. **Clean Architecture**: Separation of lib/stores/hooks follows best practices
3. **Proper MMKV Integration**: Custom storage adapters correctly implemented
4. **Auth State Sync**: Supabase listener pattern correctly syncs with Zustand
5. **Secure Storage**: Using MMKV for encrypted token storage (better than AsyncStorage)
6. **Deep Linking Setup**: Proper scheme configuration in `app.json` and redirect URI
7. **Loading States**: Proper handling of async auth operations
8. **No Hardcoded Secrets**: Environment variables used correctly
9. **Error Boundaries**: Try/catch blocks in component handlers

---

## Recommended Actions (Priority Order)

1. **FIX CRITICAL #1**: Move auth initialization to root layout ONLY (race condition)
2. **FIX CRITICAL #2**: Add error handling to getCurrentSession
3. **FIX CRITICAL #3**: Validate OAuth tokens before setting session
4. **FIX CRITICAL #4**: Add navigation loop prevention
5. **FIX CRITICAL #5**: Validate environment variables at startup
6. **FIX HIGH #6**: Add error handling to storage adapters
7. **FIX HIGH #8**: Replace `<span>` with `<Ionicons>` in tab icons
8. **FIX HIGH #9**: Remove navigation from OAuth success or add delay
9. **FIX HIGH #10**: Handle auth event errors in listener
10. **TEST**: On physical iOS/Android devices (not just Expo Go)
11. **TEST**: Network failure scenarios (airplane mode, timeout)
12. **TEST**: Token expiry and refresh flow
13. **VERIFY**: Apple/Google OAuth callbacks work with deep linking
14. **DOCUMENT**: Add setup instructions for OAuth provider configuration

---

## Security Audit

### Passed ✓
- No secrets committed to git (.env.example only)
- EXPO_PUBLIC prefix correct for client-side env vars
- Supabase anon key safe for client (assuming RLS configured)
- HTTPS enforced by Supabase SDK
- Tokens stored in MMKV (encrypted on iOS/Android)
- No SQL injection (using Supabase client)
- No XSS vectors (React Native, not web)
- OAuth state validation handled by expo-auth-session

### Failed ✗
- Token format not validated before persistence (CRITICAL #3)
- Error states can leak auth failures to console in production (#18)
- Missing rate limiting on auth attempts (should be in Supabase RLS)

---

## Performance Analysis

### Concerns
- Double auth listener setup wastes network/CPU (CRITICAL #1)
- Router object in effect deps causes unnecessary re-renders (CRITICAL #4)
- Synchronous MMKV reads on main thread acceptable (fast enough)

### Optimizations
- Consider memoizing auth state selector in useAuth
- Lazy load OAuthButton component if login screen complex
- Use Suspense for async auth check (Expo Router v6 supports)

---

## Accessibility

### Issues
- Missing accessibility labels on buttons (#15)
- Tab icons using emoji will announce incorrectly (#20)
- No screen reader announcement on auth state changes

### Recommendations
- Add `accessibilityLabel` to all interactive elements
- Use semantic HTML roles (already using `TouchableOpacity`)
- Announce auth errors to screen readers via `AccessibilityInfo.announceForAccessibility`

---

## Testing Recommendations

### Unit Tests Needed
- [ ] `signInWithOAuth` success/failure cases
- [ ] `signOut` network failure handling
- [ ] Storage adapter error recovery
- [ ] Auth store state transitions

### Integration Tests Needed
- [ ] OAuth redirect flow end-to-end
- [ ] Session persistence after app restart
- [ ] Auth state sync across screens
- [ ] Navigation routing based on auth state

### Manual Tests Required
- [ ] Test on physical iOS device (Apple Sign In requires)
- [ ] Test on physical Android device
- [ ] Airplane mode during auth
- [ ] Token expiry after 1 hour
- [ ] Kill app during OAuth flow
- [ ] Revoke tokens from Supabase dashboard

---

## Metrics

- **Type Coverage:** 100% (strict mode, no `any` except storage fallback)
- **Test Coverage:** 0% (no tests found)
- **Critical Issues:** 5
- **High Priority:** 5
- **Medium Priority:** 6
- **Low Priority:** 4
- **Lines of Code:** ~500
- **Complexity:** Medium (auth + routing + persistence)

---

## Plan Status Update

Updated plan: `/Users/tommac/Desktop/Solo Builder/my2light-v2/plans/251231-0025-my2light-bootstrap/phase-02-auth-infrastructure.md`

**Status:** In Progress → Needs Revision

**Completed:**
- ✓ Supabase client configuration
- ✓ Auth store with Zustand + MMKV
- ✓ OAuth helper functions
- ✓ Login screen UI
- ✓ Protected route structure
- ✓ Environment variable setup

**Requires Fixes:**
- ✗ Auth initialization (race condition)
- ✗ Error handling (multiple gaps)
- ✗ Token validation
- ✗ Navigation guard stability
- ✗ Tab bar icons (non-native)

**Next Steps:**
1. Address all CRITICAL issues (#1-5)
2. Fix HIGH priority warnings (#6-10)
3. Test on physical devices
4. Verify OAuth providers configured in Supabase
5. Add error tracking (Sentry)
6. Proceed to Phase 3 only after fixes verified

---

## Unresolved Questions

1. **Supabase Project Created?** Plan shows "Create Supabase project" as todo. Is this complete? Need URL/keys to test.

2. **Apple Developer Account?** Apple Sign In requires paid developer account. Is this configured?

3. **OAuth Providers Enabled?** Are Apple/Google OAuth actually enabled in Supabase dashboard with correct redirect URLs?

4. **RLS Policies?** Plan mentions RLS but no policies shown. Are user tables protected?

5. **Error Tracking Setup?** Should integrate Sentry now or Phase 7 (Testing/QA)?

6. **Deep Link Testing?** Has `my2light://` scheme been tested on physical device? Simulator behaves differently.

7. **Token Refresh Interval?** Supabase defaults to 1hr. Is this acceptable or should be shorter?

8. **Offline Behavior?** What happens if user opens app offline? Currently will fail silently.

9. **Old Directories?** Found empty `app/auth/` and `app/tabs/` dirs. Should be deleted?

10. **App Index Route?** `app/index.tsx` still shows Phase 1 placeholder. Should redirect or remove?
