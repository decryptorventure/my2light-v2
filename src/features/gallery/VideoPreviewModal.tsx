import { Modal, View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoStore } from '@/stores/videoStore';
import { shareVideo, saveToCameraRoll } from '@/lib/sharing';
import { useHaptics } from '@/hooks/useHaptics';
import type { Video as VideoType } from '@/types';
import { COLORS } from '@/lib/constants';

interface VideoPreviewModalProps {
  visible: boolean;
  video: VideoType | null;
  onClose: () => void;
}

export function VideoPreviewModal({
  visible,
  video,
  onClose,
}: VideoPreviewModalProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { removeVideo } = useVideoStore();
  const { playSuccess, playError } = useHaptics();

  if (!video) return null;

  const handleEdit = () => {
    onClose();
    router.push(`/editor/${video.id}`);
  };

  const handleShare = async () => {
    try {
      await shareVideo(video.uri);
      playSuccess();
    } catch (error) {
      playError();
      Alert.alert('Error', 'Failed to share video');
    }
  };

  const handleSave = async () => {
    try {
      await saveToCameraRoll(video.uri);
      playSuccess();
      Alert.alert('Saved!', 'Video saved to your camera roll');
    } catch (error) {
      playError();
      Alert.alert('Error', 'Failed to save video');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Video',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeVideo(video.id);
            playSuccess();
            onClose();
          },
        },
      ]
    );
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <Pressable onPress={onClose} className="p-2">
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </Pressable>
          <Text className="text-text-primary text-lg font-semibold">Preview</Text>
          <View className="w-10" />
        </View>

        {/* Video Player */}
        <Pressable onPress={togglePlay} className="flex-1 items-center justify-center">
          <Video
            ref={videoRef}
            source={{ uri: video.uri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={true}
            onPlaybackStatusUpdate={(status) => {
              if (!status.isLoaded) return;
              setIsPlaying(status.isPlaying);
            }}
          />

          {/* Play Button Overlay */}
          {!isPlaying && (
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-20 h-20 rounded-full bg-black/50 items-center justify-center">
                <Ionicons name="play" size={40} color={COLORS.textPrimary} />
              </View>
            </View>
          )}
        </Pressable>

        {/* Actions */}
        <View className="px-4 py-6 bg-surface-elevated">
          <View className="flex-row justify-around">
            <Pressable onPress={handleEdit} className="items-center">
              <View className="w-14 h-14 rounded-full bg-surface items-center justify-center mb-2">
                <Ionicons name="create-outline" size={24} color={COLORS.textPrimary} />
              </View>
              <Text className="text-text-secondary text-xs">Edit</Text>
            </Pressable>

            <Pressable onPress={handleShare} className="items-center">
              <View className="w-14 h-14 rounded-full bg-surface items-center justify-center mb-2">
                <Ionicons name="share-outline" size={24} color={COLORS.textPrimary} />
              </View>
              <Text className="text-text-secondary text-xs">Share</Text>
            </Pressable>

            <Pressable onPress={handleSave} className="items-center">
              <View className="w-14 h-14 rounded-full bg-surface items-center justify-center mb-2">
                <Ionicons name="download-outline" size={24} color={COLORS.textPrimary} />
              </View>
              <Text className="text-text-secondary text-xs">Save</Text>
            </Pressable>

            <Pressable onPress={handleDelete} className="items-center">
              <View className="w-14 h-14 rounded-full bg-surface items-center justify-center mb-2">
                <Ionicons name="trash-outline" size={24} color={COLORS.error} />
              </View>
              <Text className="text-text-secondary text-xs">Delete</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
