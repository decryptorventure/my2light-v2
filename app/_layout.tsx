import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { setupAuthListener, getCurrentSession } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationHandled = useRef(false);

  // Initialize auth once on mount
  useEffect(() => {
    const { data: { subscription } } = setupAuthListener();

    getCurrentSession()
      .then((session) => {
        if (session) {
          useAuthStore.getState().setSession(session);
          useAuthStore.getState().setUser(session.user);
        }
      })
      .catch((error) => {
        console.error('Failed to get session:', error);
        // Clear corrupted session
        useAuthStore.getState().signOut();
      })
      .finally(() => {
        useAuthStore.getState().setLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    // Prevent duplicate navigation
    if (navigationHandled.current) {
      navigationHandled.current = false;
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      navigationHandled.current = true;
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      navigationHandled.current = true;
      router.replace('/(tabs)/gallery');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}
