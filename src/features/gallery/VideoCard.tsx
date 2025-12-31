import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThumbnails } from '@/hooks/useThumbnails';
import { useHaptics } from '@/hooks/useHaptics';
import type { Video } from '@/types';
import { COLORS } from '@/lib/constants';

interface VideoCardProps {
  video: Video;
  onPress: () => void;
  onLongPress: () => void;
}

export function VideoCard({ video, onPress, onLongPress }: VideoCardProps) {
  const { thumbnailUri, isGenerating } = useThumbnails(video.id, video.uri);
  const { playLight } = useHaptics();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handlePress = () => {
    playLight();
    onPress();
  };

  const handleLongPress = () => {
    playLight();
    onLongPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      className="flex-1 aspect-[9/16] m-1 rounded-xl overflow-hidden bg-surface"
    >
      {/* Thumbnail */}
      {thumbnailUri ? (
        <Image source={{ uri: thumbnailUri }} className="w-full h-full" />
      ) : (
        <View className="w-full h-full items-center justify-center bg-surface">
          {isGenerating ? (
            <Ionicons name="hourglass" size={32} color={COLORS.textSecondary} />
          ) : (
            <Ionicons name="videocam" size={32} color={COLORS.textSecondary} />
          )}
        </View>
      )}

      {/* Gradient Overlay */}
      <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Info Overlay */}
      <View className="absolute bottom-0 left-0 right-0 p-2">
        {/* Duration */}
        <View className="bg-black/70 px-2 py-1 rounded self-start mb-1">
          <Text className="text-white text-xs font-medium">
            {formatDuration(video.duration)}
          </Text>
        </View>

        {/* Highlights Count */}
        {video.highlights.length > 0 && (
          <View className="flex-row items-center mb-1">
            <Ionicons name="star" size={12} color={COLORS.secondary} />
            <Text className="text-white text-xs ml-1">
              {video.highlights.length} highlight{video.highlights.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Date */}
        <Text className="text-white/80 text-xs">
          {formatDate(video.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}
