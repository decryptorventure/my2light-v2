import { View, Text, FlatList, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoStore } from '@/stores/videoStore';
import { useReelStore } from '@/stores/reelStore';
import { COLORS } from '@/lib/constants';

export function ClipSelector() {
  const { videos } = useVideoStore();
  const { clips, addClip } = useReelStore();

  const selectedIds = clips.map((c) => c.videoId);

  const handleSelect = (video: typeof videos[0]) => {
    if (selectedIds.includes(video.id)) return;

    addClip({
      id: `${video.id}_${Date.now()}`,
      videoId: video.id,
      videoUri: video.uri,
      thumbnailUri: video.thumbnailUri,
      duration: video.duration,
    });
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View className="flex-1">
      <Text className="text-text-secondary text-sm px-4 mb-2">
        Select videos to add to reel
      </Text>

      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ padding: 8 }}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);

          return (
            <Pressable
              onPress={() => handleSelect(item)}
              className="flex-1 aspect-square m-1 rounded-lg overflow-hidden"
              style={{ maxWidth: '31%' }}
            >
              {item.thumbnailUri ? (
                <Image
                  source={{ uri: item.thumbnailUri }}
                  className="w-full h-full"
                />
              ) : (
                <View className="w-full h-full bg-surface items-center justify-center">
                  <Ionicons name="videocam" size={32} color={COLORS.textSecondary} />
                </View>
              )}

              {/* Duration Badge */}
              <View className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded">
                <Text className="text-white text-xs">
                  {formatDuration(item.duration)}
                </Text>
              </View>

              {/* Selected Overlay */}
              {isSelected && (
                <View className="absolute inset-0 bg-primary/50 items-center justify-center">
                  <Ionicons name="checkmark-circle" size={32} color="white" />
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-text-secondary">No videos yet</Text>
            <Text className="text-text-secondary text-sm mt-1">
              Record some highlights first
            </Text>
          </View>
        }
      />
    </View>
  );
}
