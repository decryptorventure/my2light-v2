import { View, Text } from 'react-native';

export default function IndexScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-text-primary text-2xl font-bold mb-2">My2Light</Text>
      <Text className="text-text-secondary">Phase 1: Foundation Complete</Text>
      <Text className="text-text-secondary text-sm mt-4">Ready for Phase 2</Text>
    </View>
  );
}
