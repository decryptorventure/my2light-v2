import { View, Pressable } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { forwardRef } from 'react';
import { COLORS } from '@/lib/constants';

interface VideoPlayerProps {
  uri: string;
  isPlaying: boolean;
  onPlaybackStatusUpdate: (status: AVPlaybackStatus) => void;
  onTogglePlay: () => void;
}

export const VideoPlayer = forwardRef<Video, VideoPlayerProps>(
  ({ uri, isPlaying, onPlaybackStatusUpdate, onTogglePlay }, ref) => {
    return (
      <View className="aspect-video bg-black relative">
        <Video
          ref={ref}
          source={{ uri }}
          style={{ flex: 1 }}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          shouldPlay={false}
          isLooping={false}
        />

        {/* Play/Pause Overlay */}
        <Pressable
          onPress={onTogglePlay}
          className="absolute inset-0 items-center justify-center"
        >
          {!isPlaying && (
            <View className="w-16 h-16 rounded-full bg-black/50 items-center justify-center">
              <Ionicons name="play" size={32} color={COLORS.textPrimary} />
            </View>
          )}
        </Pressable>
      </View>
    );
  }
);
