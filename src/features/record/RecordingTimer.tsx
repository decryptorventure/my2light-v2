import { View, Text } from 'react-native';

interface RecordingTimerProps {
  duration: number;
  isRecording: boolean;
  highlightCount: number;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function RecordingTimer({
  duration,
  isRecording,
  highlightCount,
}: RecordingTimerProps) {
  if (!isRecording) return null;

  return (
    <View className="absolute top-16 left-0 right-0 items-center">
      <View className="flex-row items-center bg-black/60 px-4 py-2 rounded-full">
        <View className="w-3 h-3 rounded-full bg-primary mr-2" />
        <Text className="text-white text-lg font-mono">
          {formatDuration(duration)}
        </Text>
        {highlightCount > 0 && (
          <View className="ml-3 flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-secondary mr-1" />
            <Text className="text-secondary">{highlightCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
