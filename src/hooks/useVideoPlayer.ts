import { useRef, useState, useCallback } from 'react';
import { Video, AVPlaybackStatus } from 'expo-av';

interface UseVideoPlayerReturn {
  videoRef: React.RefObject<Video | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (time: number) => Promise<void>;
  setPlaybackSpeed: (rate: number) => Promise<void>;
  onPlaybackStatusUpdate: (status: AVPlaybackStatus) => void;
}

export function useVideoPlayer(): UseVideoPlayerReturn {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setIsLoaded(false);
      return;
    }

    setIsLoaded(true);
    setIsPlaying(status.isPlaying);
    setCurrentTime(status.positionMillis / 1000);
    setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
  }, []);

  const play = useCallback(async () => {
    await videoRef.current?.playAsync();
  }, []);

  const pause = useCallback(async () => {
    await videoRef.current?.pauseAsync();
  }, []);

  const seekTo = useCallback(async (time: number) => {
    await videoRef.current?.setPositionAsync(time * 1000);
  }, []);

  const setPlaybackSpeed = useCallback(async (rate: number) => {
    await videoRef.current?.setRateAsync(rate, true);
  }, []);

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    isLoaded,
    play,
    pause,
    seekTo,
    setPlaybackSpeed,
    onPlaybackStatusUpdate,
  };
}
