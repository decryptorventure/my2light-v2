import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/lib/constants';

export function EmptyGallery() {
  const handleRecord = () => {
    router.push('/(tabs)/record');
  };

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Ionicons name="videocam-outline" size={80} color={COLORS.textSecondary} />
      <Text className="text-text-primary text-2xl font-bold mt-6 text-center">
        No Videos Yet
      </Text>
      <Text className="text-text-secondary text-center mt-2">
        Start recording your pickleball highlights to see them here
      </Text>
      <Pressable
        onPress={handleRecord}
        className="bg-primary px-8 py-4 rounded-xl mt-8 flex-row items-center"
      >
        <Ionicons name="add" size={24} color="white" />
        <Text className="text-white font-semibold text-lg ml-2">
          Record Your First Video
        </Text>
      </Pressable>
    </View>
  );
}
