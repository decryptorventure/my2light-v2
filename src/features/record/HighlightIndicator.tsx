import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

interface HighlightIndicatorProps {
  visible: boolean;
  onHide: () => void;
}

export function HighlightIndicator({ visible, onHide }: HighlightIndicatorProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withTiming(1, { duration: 100 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(800, withTiming(0, { duration: 300 }, () => {
          runOnJS(onHide)();
        }))
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View className="absolute inset-0 items-center justify-center pointer-events-none">
      <Animated.View
        style={animatedStyle}
        className="bg-secondary/90 px-8 py-4 rounded-2xl"
      >
        <Text className="text-black text-xl font-bold">Highlight Tagged!</Text>
      </Animated.View>
    </View>
  );
}
