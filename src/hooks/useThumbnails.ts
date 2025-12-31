import { useState, useEffect } from 'react';
import { generateThumbnail } from '@/lib/ffmpeg';
import { getThumbnailPath } from '@/lib/videoStorage';
import * as FileSystem from 'expo-file-system';
import type { VideoId } from '@/types';

interface UseThumbnailsReturn {
  thumbnailUri: string | null;
  isGenerating: boolean;
  regenerate: () => Promise<void>;
}

export function useThumbnails(
  videoId: VideoId,
  videoUri: string
): UseThumbnailsReturn {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadThumbnail();
  }, [videoId]);

  const loadThumbnail = async () => {
    const thumbPath = getThumbnailPath(videoId);
    const fileInfo = await FileSystem.getInfoAsync(thumbPath);

    if (fileInfo.exists) {
      setThumbnailUri(thumbPath);
    } else {
      await generateNewThumbnail();
    }
  };

  const generateNewThumbnail = async () => {
    setIsGenerating(true);
    try {
      const thumbPath = await generateThumbnail(videoUri, 0);
      setThumbnailUri(thumbPath);
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerate = async () => {
    await generateNewThumbnail();
  };

  return { thumbnailUri, isGenerating, regenerate };
}
