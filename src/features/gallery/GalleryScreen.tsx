import { View, FlatList, RefreshControl, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoStore } from '@/stores/videoStore';
import { VideoCard } from './VideoCard';
import { VideoPreviewModal } from './VideoPreviewModal';
import { EmptyGallery } from './EmptyGallery';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Video } from '@/types';
import { COLORS } from '@/lib/constants';

export function GalleryScreen() {
  const { videos } = useVideoStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app, might refetch from Supabase
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleVideoPress = (video: Video) => {
    setSelectedVideo(video);
    setShowPreview(true);
  };

  const handleVideoLongPress = (video: Video) => {
    setSelectedVideo(video);
    setShowPreview(true);
  };

  const handleCreateReel = () => {
    router.push('/reel');
  };

  if (videos.length === 0 && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyGallery />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <Text className="text-text-primary text-2xl font-bold">Gallery</Text>
          <Pressable
            onPress={handleCreateReel}
            className="flex-row items-center bg-primary px-4 py-2 rounded-full"
          >
            <Ionicons name="film" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Create Reel</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View className="px-4 py-2">
          <Text className="text-text-secondary text-sm">
            {videos.length} video{videos.length !== 1 ? 's' : ''} •{' '}
            {videos.reduce((sum, v) => sum + v.highlights.length, 0)} highlight
            {videos.reduce((sum, v) => sum + v.highlights.length, 0) !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Video Grid */}
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <VideoCard
              video={item}
              onPress={() => handleVideoPress(item)}
              onLongPress={() => handleVideoLongPress(item)}
            />
          )}
        />

        {/* Preview Modal */}
        <VideoPreviewModal
          visible={showPreview}
          video={selectedVideo}
          onClose={() => {
            setShowPreview(false);
            setSelectedVideo(null);
          }}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
