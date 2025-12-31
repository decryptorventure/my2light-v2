import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '@/lib/storage';
import type { Video, Highlight, VideoId, HighlightId } from '@/types';

interface VideoState {
  videos: Video[];
  currentRecording: {
    isRecording: boolean;
    startTime: number | null;
    highlights: { timestamp: number }[];
  };

  // Actions
  addVideo: (video: Video) => void;
  removeVideo: (id: VideoId) => void;
  addHighlight: (videoId: VideoId, highlight: Highlight) => void;
  removeHighlight: (videoId: VideoId, highlightId: HighlightId) => void;

  // Recording actions
  startRecording: () => void;
  stopRecording: () => void;
  tagHighlight: () => void;
  resetRecording: () => void;
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

export const useVideoStore = create<VideoState>()(
  persist(
    (set, get) => ({
      videos: [],
      currentRecording: {
        isRecording: false,
        startTime: null,
        highlights: [],
      },

      addVideo: (video) =>
        set((state) => ({ videos: [video, ...state.videos] })),

      removeVideo: (id) =>
        set((state) => ({
          videos: state.videos.filter((v) => v.id !== id),
        })),

      addHighlight: (videoId, highlight) =>
        set((state) => ({
          videos: state.videos.map((v) =>
            v.id === videoId
              ? { ...v, highlights: [...v.highlights, highlight] }
              : v
          ),
        })),

      removeHighlight: (videoId, highlightId) =>
        set((state) => ({
          videos: state.videos.map((v) =>
            v.id === videoId
              ? {
                  ...v,
                  highlights: v.highlights.filter((h) => h.id !== highlightId),
                }
              : v
          ),
        })),

      startRecording: () =>
        set({
          currentRecording: {
            isRecording: true,
            startTime: Date.now(),
            highlights: [],
          },
        }),

      stopRecording: () =>
        set((state) => ({
          currentRecording: {
            ...state.currentRecording,
            isRecording: false,
          },
        })),

      tagHighlight: () => {
        const { currentRecording } = get();
        if (!currentRecording.isRecording || !currentRecording.startTime) return;

        const timestamp = (Date.now() - currentRecording.startTime) / 1000;
        set({
          currentRecording: {
            ...currentRecording,
            highlights: [...currentRecording.highlights, { timestamp }],
          },
        });
      },

      resetRecording: () =>
        set({
          currentRecording: {
            isRecording: false,
            startTime: null,
            highlights: [],
          },
        }),
    }),
    {
      name: 'video-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ videos: state.videos }),
    }
  )
);
