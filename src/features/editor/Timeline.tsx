import { View, Text, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '@/lib/constants';

interface TimelineProps {
  duration: number;
  currentTime: number;
  trimStart: number;
  trimEnd: number;
  onTrimStartChange: (time: number) => void;
  onTrimEndChange: (time: number) => void;
  onSeek: (time: number) => void;
}

const TIMELINE_HEIGHT = 60;
const HANDLE_WIDTH = 20;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMELINE_WIDTH = SCREEN_WIDTH - 32; // padding

export function Timeline({
  duration,
  currentTime,
  trimStart,
  trimEnd,
  onTrimStartChange,
  onTrimEndChange,
  onSeek,
}: TimelineProps) {
  const timeToX = (time: number) => (time / duration) * TIMELINE_WIDTH;
  const xToTime = (x: number) => (x / TIMELINE_WIDTH) * duration;

  const trimStartX = useSharedValue(timeToX(trimStart));
  const trimEndX = useSharedValue(timeToX(trimEnd));

  // Update shared values when props change
  trimStartX.value = timeToX(trimStart);
  trimEndX.value = timeToX(trimEnd);

  const leftHandleGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newX = Math.max(0, Math.min(e.absoluteX - 16, trimEndX.value - HANDLE_WIDTH));
      trimStartX.value = newX;
      const newTime = xToTime(newX);
      runOnJS(onTrimStartChange)(newTime);
    });

  const rightHandleGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newX = Math.max(
        trimStartX.value + HANDLE_WIDTH,
        Math.min(e.absoluteX - 16, TIMELINE_WIDTH)
      );
      trimEndX.value = newX;
      const newTime = xToTime(newX);
      runOnJS(onTrimEndChange)(newTime);
    });

  const scrubberGesture = Gesture.Tap()
    .onEnd((e) => {
      const time = xToTime(e.x);
      runOnJS(onSeek)(Math.max(trimStart, Math.min(time, trimEnd)));
    });

  const leftHandleStyle = useAnimatedStyle(() => ({
    left: trimStartX.value,
  }));

  const rightHandleStyle = useAnimatedStyle(() => ({
    left: trimEndX.value - HANDLE_WIDTH,
  }));

  const selectedRegionStyle = useAnimatedStyle(() => ({
    left: trimStartX.value + HANDLE_WIDTH,
    width: trimEndX.value - trimStartX.value - HANDLE_WIDTH,
  }));

  const playheadPosition = timeToX(currentTime);

  return (
    <View className="px-4 py-4">
      {/* Time labels */}
      <View className="flex-row justify-between mb-2">
        <Text className="text-text-secondary text-xs">
          {formatTime(trimStart)}
        </Text>
        <Text className="text-text-primary text-sm font-mono">
          {formatTime(currentTime)}
        </Text>
        <Text className="text-text-secondary text-xs">
          {formatTime(trimEnd)}
        </Text>
      </View>

      {/* Timeline Track */}
      <GestureDetector gesture={scrubberGesture}>
        <View
          className="h-[60px] bg-surface-elevated rounded-lg relative overflow-hidden"
          style={{ width: TIMELINE_WIDTH }}
        >
          {/* Trimmed region (darker) */}
          <View className="absolute inset-0 bg-surface" />

          {/* Selected region (lighter) */}
          <Animated.View
            className="absolute top-0 bottom-0 bg-surface-elevated"
            style={selectedRegionStyle}
          />

          {/* Left Trim Handle */}
          <GestureDetector gesture={leftHandleGesture}>
            <Animated.View
              className="absolute top-0 bottom-0 w-5 bg-secondary rounded-l-lg items-center justify-center"
              style={leftHandleStyle}
            >
              <View className="w-1 h-6 bg-black/30 rounded" />
            </Animated.View>
          </GestureDetector>

          {/* Right Trim Handle */}
          <GestureDetector gesture={rightHandleGesture}>
            <Animated.View
              className="absolute top-0 bottom-0 w-5 bg-secondary rounded-r-lg items-center justify-center"
              style={rightHandleStyle}
            >
              <View className="w-1 h-6 bg-black/30 rounded" />
            </Animated.View>
          </GestureDetector>

          {/* Playhead */}
          <View
            className="absolute top-0 bottom-0 w-0.5 bg-primary"
            style={{ left: playheadPosition }}
          />
        </View>
      </GestureDetector>

      {/* Duration info */}
      <Text className="text-text-secondary text-xs text-center mt-2">
        Selected: {formatTime(trimEnd - trimStart)}
      </Text>
    </View>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
