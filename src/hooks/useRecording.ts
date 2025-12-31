import { useState, useCallback, useRef, useEffect } from 'react';
import { CameraView } from 'expo-camera';
import { useVideoStore } from '@/stores/videoStore';
import {
  saveVideo,
  generateVideoId,
  createVideoMetadata,
} from '@/lib/videoStorage';

interface UseRecordingReturn {
  isRecording: boolean;
  duration: number;
  highlightCount: number;
  startRecording: (cameraRef: React.RefObject<CameraView | null>) => Promise<void>;
  stopRecording: () => Promise<void>;
  tagHighlight: () => void;
}

export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cameraRefLocal = useRef<CameraView | null>(null);

  const {
    currentRecording,
    startRecording: storeStartRecording,
    stopRecording: storeStopRecording,
    tagHighlight: storeTagHighlight,
    resetRecording,
    addVideo,
  } = useVideoStore();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(
    async (cameraRef: React.RefObject<CameraView | null>) => {
      if (!cameraRef.current || isRecording) return;

      cameraRefLocal.current = cameraRef.current;
      setIsRecording(true);
      storeStartRecording();
      setDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      try {
        const video = await cameraRef.current.recordAsync({
          maxDuration: 600, // 10 minutes max
        });

        // Recording stopped, process video
        if (video?.uri) {
          const videoId = generateVideoId();
          const savedUri = await saveVideo(video.uri, videoId);

          // Read current state to avoid stale closure
          const finalDuration = duration;
          const finalHighlights = useVideoStore.getState().currentRecording.highlights;

          const videoMetadata = createVideoMetadata(
            videoId,
            savedUri,
            finalDuration,
            finalHighlights
          );

          addVideo(videoMetadata);
        }
      } catch (error) {
        console.error('Recording error:', error);
      } finally {
        resetRecording();
      }
    },
    [isRecording, duration, storeStartRecording, resetRecording, addVideo]
  );

  const stopRecording = useCallback(async () => {
    if (!cameraRefLocal.current || !isRecording) return;

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    storeStopRecording();

    // Stop camera recording
    cameraRefLocal.current.stopRecording();
  }, [isRecording, storeStopRecording]);

  const tagHighlight = useCallback(() => {
    if (!isRecording) return;
    storeTagHighlight();
  }, [isRecording, storeTagHighlight]);

  return {
    isRecording,
    duration,
    highlightCount: currentRecording.highlights.length,
    startRecording,
    stopRecording,
    tagHighlight,
  };
}
