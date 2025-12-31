import { create } from 'zustand';
import type { VideoId } from '@/types';

interface EditorState {
  // Current editing session
  videoId: VideoId | null;
  videoUri: string | null;
  duration: number;

  // Edit parameters
  trimStart: number;
  trimEnd: number;
  speed: number;
  musicUri: string | null;
  musicVolume: number;

  // Processing state
  isProcessing: boolean;
  processingProgress: number;
  processingStep: string;

  // Actions
  initEditor: (videoId: VideoId, uri: string, duration: number) => void;
  setTrimStart: (time: number) => void;
  setTrimEnd: (time: number) => void;
  setSpeed: (speed: number) => void;
  setMusic: (uri: string | null) => void;
  setMusicVolume: (volume: number) => void;
  setProcessing: (isProcessing: boolean, step?: string) => void;
  setProcessingProgress: (progress: number) => void;
  resetEditor: () => void;
}

const initialState = {
  videoId: null,
  videoUri: null,
  duration: 0,
  trimStart: 0,
  trimEnd: 0,
  speed: 1,
  musicUri: null,
  musicVolume: 0.3,
  isProcessing: false,
  processingProgress: 0,
  processingStep: '',
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  initEditor: (videoId, uri, duration) =>
    set({
      videoId,
      videoUri: uri,
      duration,
      trimStart: 0,
      trimEnd: duration,
    }),

  setTrimStart: (time) => set({ trimStart: time }),
  setTrimEnd: (time) => set({ trimEnd: time }),
  setSpeed: (speed) => set({ speed }),
  setMusic: (uri) => set({ musicUri: uri }),
  setMusicVolume: (volume) => set({ musicVolume: volume }),

  setProcessing: (isProcessing, step = '') =>
    set({ isProcessing, processingStep: step, processingProgress: 0 }),

  setProcessingProgress: (progress) => set({ processingProgress: progress }),

  resetEditor: () => set(initialState),
}));
