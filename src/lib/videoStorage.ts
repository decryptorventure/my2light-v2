import * as FileSystem from 'expo-file-system';
import { Video, Highlight } from '@/types';
import { VIDEO } from './constants';

// Safely access documentDirectory with proper type checking
const getDocumentDirectory = (): string | null => {
  return (FileSystem as any).documentDirectory ?? null;
};

const getVideoDir = (): string => {
  const dir = getDocumentDirectory();
  // We MUST check if it's a string and not empty
  if (dir && typeof dir === 'string') {
    return `${dir}videos/`;
  }
  // Return a dummy path for non-native environments instead of throwing
  return 'videos/';
};

export async function ensureVideoDirectory() {
  const videoDir = getVideoDir();
  const dirInfo = await FileSystem.getInfoAsync(videoDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(videoDir, { intermediates: true });
  }
}

export function generateVideoId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getVideoPath(videoId: string): string {
  return `${getVideoDir()}${videoId}.mp4`;
}

export async function saveVideo(
  tempUri: string,
  videoId: string
): Promise<string> {
  await ensureVideoDirectory();
  const destPath = getVideoPath(videoId);
  await FileSystem.moveAsync({ from: tempUri, to: destPath });
  return destPath;
}

export async function deleteVideo(videoId: string): Promise<void> {
  const videoPath = getVideoPath(videoId);
  const fileInfo = await FileSystem.getInfoAsync(videoPath);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(videoPath);
  }

  // Also delete thumbnail if exists
  const thumbPath = getThumbnailPath(videoId);
  const thumbInfo = await FileSystem.getInfoAsync(thumbPath);
  if (thumbInfo.exists) {
    await FileSystem.deleteAsync(thumbPath);
  }
}

export function getThumbnailPath(videoId: string): string {
  return `${getVideoDir()}${videoId}_thumb.jpg`;
}

export async function getVideoFileSize(videoId: string): Promise<number> {
  const videoPath = getVideoPath(videoId);
  const fileInfo = await FileSystem.getInfoAsync(videoPath);
  return fileInfo.exists && 'size' in fileInfo ? (fileInfo.size || 0) : 0;
}

export function createVideoMetadata(
  videoId: string,
  uri: string,
  duration: number,
  highlights: { timestamp: number }[]
): Video {
  return {
    id: videoId,
    uri,
    duration,
    createdAt: new Date(),
    highlights: highlights.map((h, i) => ({
      id: `hl_${videoId}_${i}`,
      videoId,
      timestamp: h.timestamp,
      duration: VIDEO.defaultHighlightDuration,
    })),
  };
}
