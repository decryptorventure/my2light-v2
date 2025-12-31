import { useAuthStore } from '@/stores/authStore';

/**
 * Hook to access auth state (read-only).
 * Auth initialization happens in app/_layout.tsx to prevent race conditions.
 */
export function useAuth() {
  const { user, session, isLoading, isAuthenticated } = useAuthStore();
  return { user, session, isLoading, isAuthenticated };
}
