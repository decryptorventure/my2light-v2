import { View, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

interface CameraControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTagHighlight: () => void;
  onFlipCamera: () => void;
}

export function CameraControls({
  isRecording,
  onStartRecording,
  onStopRecording,
  onTagHighlight,
  onFlipCamera,
}: CameraControlsProps) {
  const recordScale = useSharedValue(1);

  const recordButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordScale.value }],
  }));

  const handleRecordPress = () => {
    if (isRecording) {
      recordScale.value = withTiming(1);
      onStopRecording();
    } else {
      recordScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1
      );
      onStartRecording();
    }
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 pb-12 pt-6">
      <View className="flex-row items-center justify-around px-8">
        {/* Flip Camera */}
        <Pressable
          onPress={onFlipCamera}
          disabled={isRecording}
          className="w-14 h-14 rounded-full bg-surface items-center justify-center"
        >
          <Ionicons
            name="camera-reverse"
            size={28}
            color={isRecording ? COLORS.textSecondary : COLORS.textPrimary}
          />
        </Pressable>

        {/* Record Button */}
        <Animated.View style={recordButtonStyle}>
          <Pressable
            onPress={handleRecordPress}
            className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
          >
            <View
              className={`${
                isRecording ? 'w-8 h-8 rounded-md' : 'w-16 h-16 rounded-full'
              } bg-primary`}
            />
          </Pressable>
        </Animated.View>

        {/* Tag Highlight */}
        <Pressable
          onPress={onTagHighlight}
          disabled={!isRecording}
          className={`w-14 h-14 rounded-full items-center justify-center ${
            isRecording ? 'bg-secondary' : 'bg-surface'
          }`}
        >
          <Ionicons
            name="star"
            size={28}
            color={isRecording ? COLORS.background : COLORS.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}
