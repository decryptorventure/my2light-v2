import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export async function shareVideo(videoUri: string): Promise<boolean> {
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(videoUri, {
    mimeType: 'video/mp4',
    dialogTitle: 'Share your highlight reel',
    UTI: 'public.movie',
  });

  return true;
}

export async function saveToCameraRoll(videoUri: string): Promise<string> {
  const { status } = await MediaLibrary.requestPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Media library permission required');
  }

  const asset = await MediaLibrary.createAssetAsync(videoUri);

  // Optionally create an album
  const album = await MediaLibrary.getAlbumAsync('My2Light');
  if (album) {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  } else {
    await MediaLibrary.createAlbumAsync('My2Light', asset, false);
  }

  return asset.uri;
}

export async function getFileSize(uri: string): Promise<string> {
  const fileInfo = await FileSystem.getInfoAsync(uri);

  if (!fileInfo.exists || !('size' in fileInfo) || !fileInfo.size) {
    return 'Unknown';
  }

  const bytes = fileInfo.size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
