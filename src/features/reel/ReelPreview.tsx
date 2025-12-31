import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { useRef, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useReelStore } from '@/stores/reelStore';
import { shareVideo, saveToCameraRoll, getFileSize } from '@/lib/sharing';
import { COLORS } from '@/lib/constants';

export function ReelPreview() {
  const videoRef = useRef<Video>(null);
  const { exportedUri, reset } = useReelStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileSize, setFileSize] = useState<string>('');

  useEffect(() => {
    if (exportedUri) {
      getFileSize(exportedUri).then(setFileSize);
    }
  }, [exportedUri]);

  if (!exportedUri) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-secondary">No reel to preview</Text>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      await shareVideo(exportedUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to share video');
    }
  };

  const handleSave = async () => {
    try {
      await saveToCameraRoll(exportedUri);
      Alert.alert('Saved!', 'Reel saved to your camera roll');
    } catch (error) {
      Alert.alert('Error', 'Failed to save video');
    }
  };

  const handleDone = () => {
    reset();
    router.replace('/(tabs)/gallery');
  };

  const togglePlay = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={handleDone} className="p-2">
          <Ionicons name="checkmark" size={28} color={COLORS.primary} />
        </Pressable>
        <Text className="text-text-primary text-lg font-semibold">
          Your Reel
        </Text>
        <View className="w-10" />
      </View>

      {/* Video Player */}
      <Pressable onPress={togglePlay} className="flex-1">
        <Video
          ref={videoRef}
          source={{ uri: exportedUri }}
          style={{ flex: 1 }}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
            }
          }}
          isLooping
        />
        {!isPlaying && (
          <View className="absolute inset-0 items-center justify-center">
            <View className="w-20 h-20 rounded-full bg-black/50 items-center justify-center">
              <Ionicons name="play" size={40} color="white" />
            </View>
          </View>
        )}
      </Pressable>

      {/* File Info */}
      <View className="px-4 py-2">
        <Text className="text-text-secondary text-center text-sm">
          File size: {fileSize}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row px-4 pb-4 gap-4">
        <Pressable
          onPress={handleSave}
          className="flex-1 bg-surface py-4 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="download-outline" size={24} color={COLORS.textPrimary} />
          <Text className="text-text-primary font-medium ml-2">Save</Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          className="flex-1 bg-primary py-4 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="share-outline" size={24} color="white" />
          <Text className="text-white font-medium ml-2">Share</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
