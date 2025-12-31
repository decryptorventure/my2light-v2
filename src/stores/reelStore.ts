import { create } from 'zustand';
import type { VideoId } from '@/types';

interface ReelClip {
  id: string;
  videoId: VideoId;
  videoUri: string;
  thumbnailUri?: string;
  duration: number;
  order: number;
}

interface ReelState {
  clips: ReelClip[];
  isProcessing: boolean;
  processingProgress: number;
  exportedUri: string | null;

  // Actions
  addClip: (clip: Omit<ReelClip, 'order'>) => void;
  removeClip: (id: string) => void;
  reorderClips: (fromIndex: number, toIndex: number) => void;
  clearClips: () => void;
  setProcessing: (processing: boolean) => void;
  setProgress: (progress: number) => void;
  setExportedUri: (uri: string | null) => void;
  reset: () => void;
}

const initialState = {
  clips: [],
  isProcessing: false,
  processingProgress: 0,
  exportedUri: null,
};

export const useReelStore = create<ReelState>((set, get) => ({
  ...initialState,

  addClip: (clip) =>
    set((state) => ({
      clips: [...state.clips, { ...clip, order: state.clips.length }],
    })),

  removeClip: (id) =>
    set((state) => ({
      clips: state.clips
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, order: i })),
    })),

  reorderClips: (fromIndex, toIndex) =>
    set((state) => {
      const newClips = [...state.clips];
      const [moved] = newClips.splice(fromIndex, 1);
      newClips.splice(toIndex, 0, moved);
      return {
        clips: newClips.map((c, i) => ({ ...c, order: i })),
      };
    }),

  clearClips: () => set({ clips: [] }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setProgress: (processingProgress) => set({ processingProgress }),
  setExportedUri: (exportedUri) => set({ exportedUri }),
  reset: () => set(initialState),
}));
