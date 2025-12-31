import { useCallback } from 'react';
import { haptics } from '@/lib/haptics';

export function useHaptics() {
  const playSelection = useCallback(() => haptics.selection(), []);
  const playSuccess = useCallback(() => haptics.success(), []);
  const playError = useCallback(() => haptics.error(), []);
  const playLight = useCallback(() => haptics.light(), []);
  const playMedium = useCallback(() => haptics.medium(), []);

  return {
    playSelection,
    playSuccess,
    playError,
    playLight,
    playMedium,
  };
}
