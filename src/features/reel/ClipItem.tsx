import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '@/lib/constants';

interface ClipItemProps {
  thumbnailUri?: string;
  duration: number;
  order: number;
  isActive?: boolean;
  onRemove: () => void;
}

export function ClipItem({
  thumbnailUri,
  duration,
  order,
  isActive,
  onRemove,
}: ClipItemProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isActive ? 1.05 : 1) }],
  }));

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View
      style={animatedStyle}
      className="flex-row items-center bg-surface rounded-xl p-3 mb-2"
    >
      {/* Drag Handle */}
      <View className="pr-3">
        <Ionicons name="menu" size={24} color={COLORS.textSecondary} />
      </View>

      {/* Thumbnail */}
      <View className="w-20 h-12 rounded-lg bg-surface-elevated overflow-hidden">
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} className="w-full h-full" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="videocam" size={20} color={COLORS.textSecondary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1 ml-3">
        <Text className="text-text-primary font-medium">Clip {order + 1}</Text>
        <Text className="text-text-secondary text-sm">
          {formatDuration(duration)}
        </Text>
      </View>

      {/* Remove Button */}
      <Pressable onPress={onRemove} className="p-2">
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </Pressable>
    </Animated.View>
  );
}
