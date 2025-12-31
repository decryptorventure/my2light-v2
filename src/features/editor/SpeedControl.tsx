import { View, Text, Pressable, ScrollView } from 'react-native';
import { VIDEO } from '@/lib/constants';

interface SpeedControlProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export function SpeedControl({ currentSpeed, onSpeedChange }: SpeedControlProps) {
  return (
    <View className="py-4">
      <Text className="text-text-secondary text-sm px-4 mb-2">Speed</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {VIDEO.speedOptions.map((speed) => (
          <Pressable
            key={speed}
            onPress={() => onSpeedChange(speed)}
            className={`px-4 py-2 rounded-full ${
              currentSpeed === speed ? 'bg-primary' : 'bg-surface'
            }`}
          >
            <Text
              className={`font-medium ${
                currentSpeed === speed ? 'text-white' : 'text-text-secondary'
              }`}
            >
              {speed}x
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
