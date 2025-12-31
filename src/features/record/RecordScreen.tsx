import { View, Text, Pressable } from 'react-native';
import { CameraView } from 'expo-camera';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCamera } from '@/hooks/useCamera';
import { useRecording } from '@/hooks/useRecording';
import { CameraControls } from './CameraControls';
import { RecordingTimer } from './RecordingTimer';
import { HighlightIndicator } from './HighlightIndicator';

export function RecordScreen() {
  const {
    cameraRef,
    hasPermission,
    facing,
    requestPermission,
    toggleFacing,
  } = useCamera();

  const {
    isRecording,
    duration,
    highlightCount,
    startRecording,
    stopRecording,
    tagHighlight,
  } = useRecording();

  const [showHighlightIndicator, setShowHighlightIndicator] = useState(false);

  const handleStartRecording = useCallback(() => {
    startRecording(cameraRef);
  }, [cameraRef, startRecording]);

  const handleTagHighlight = useCallback(() => {
    tagHighlight();
    setShowHighlightIndicator(true);
  }, [tagHighlight]);

  // Permission not yet determined
  if (hasPermission === null) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-secondary">Checking permissions...</Text>
      </View>
    );
  }

  // Permission denied
  if (hasPermission === false) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-text-primary text-xl text-center mb-4">
          Camera Access Required
        </Text>
        <Text className="text-text-secondary text-center mb-8">
          My2Light needs camera and microphone access to record your pickleball highlights.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-primary px-8 py-4 rounded-xl"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        mode="video"
      />

      <RecordingTimer
        duration={duration}
        isRecording={isRecording}
        highlightCount={highlightCount}
      />

      <HighlightIndicator
        visible={showHighlightIndicator}
        onHide={() => setShowHighlightIndicator(false)}
      />

      <CameraControls
        isRecording={isRecording}
        onStartRecording={handleStartRecording}
        onStopRecording={stopRecording}
        onTagHighlight={handleTagHighlight}
        onFlipCamera={toggleFacing}
      />
    </View>
  );
}
