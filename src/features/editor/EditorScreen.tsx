import { View, Alert, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useCallback } from 'react';
import { useVideoStore } from '@/stores/videoStore';
import { useEditorStore } from '@/stores/editorStore';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import {
  trimVideo,
  changeSpeed,
  addMusicOverlay,
  cancelAllFFmpegSessions,
} from '@/lib/ffmpeg';
import { saveVideo, generateVideoId, createVideoMetadata } from '@/lib/videoStorage';
import { VideoPlayer } from './VideoPlayer';
import { Timeline } from './Timeline';
import { SpeedControl } from './SpeedControl';
import { MusicPicker } from './MusicPicker';
import { ProcessingModal } from './ProcessingModal';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

export function EditorScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const { videos, addVideo } = useVideoStore();
  const video = videos.find((v) => v.id === videoId);

  const {
    videoRef,
    isPlaying,
    currentTime,
    play,
    pause,
    seekTo,
    setPlaybackSpeed,
    onPlaybackStatusUpdate,
  } = useVideoPlayer();

  const {
    trimStart,
    trimEnd,
    speed,
    musicUri,
    musicVolume,
    isProcessing,
    processingProgress,
    processingStep,
    initEditor,
    setTrimStart,
    setTrimEnd,
    setSpeed,
    setMusic,
    setMusicVolume,
    setProcessing,
    setProcessingProgress,
    resetEditor,
  } = useEditorStore();

  useEffect(() => {
    if (video) {
      initEditor(video.id, video.uri, video.duration);
    }
    return () => resetEditor();
  }, [video?.id]);

  // Sync playback speed with editor
  useEffect(() => {
    setPlaybackSpeed(speed);
  }, [speed]);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying]);

  const handleExport = async () => {
    if (!video) return;

    setProcessing(true, 'Preparing...');

    try {
      let currentPath = video.uri;
      const trimmedDuration = trimEnd - trimStart;

      // Step 1: Trim if needed
      if (trimStart > 0 || trimEnd < video.duration) {
        setProcessing(true, 'Trimming video...');
        currentPath = await trimVideo(currentPath, trimStart, trimEnd, {
          onProgress: (p) => setProcessingProgress(p.percentage * 0.33),
        });
      }

      // Step 2: Speed change if needed
      if (speed !== 1) {
        setProcessing(true, 'Adjusting speed...');
        currentPath = await changeSpeed(currentPath, speed, trimmedDuration, {
          onProgress: (p) => setProcessingProgress(33 + p.percentage * 0.33),
        });
      }

      // Step 3: Music overlay if needed
      if (musicUri) {
        setProcessing(true, 'Adding music...');
        currentPath = await addMusicOverlay(
          currentPath,
          musicUri,
          trimmedDuration / speed,
          musicVolume,
          1.0,
          {
            onProgress: (p) => setProcessingProgress(66 + p.percentage * 0.34),
          }
        );
      }

      // Save as new video
      const newVideoId = generateVideoId();
      const savedUri = await saveVideo(currentPath, newVideoId);
      const newDuration = trimmedDuration / speed;

      const newVideo = createVideoMetadata(newVideoId, savedUri, newDuration, []);
      addVideo(newVideo);

      setProcessing(false);
      Alert.alert('Success', 'Video exported successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      setProcessing(false);
      Alert.alert('Error', 'Failed to export video. Please try again.');
      console.error('Export error:', error);
    }
  };

  const handleCancelProcessing = () => {
    cancelAllFFmpegSessions();
    setProcessing(false);
  };

  if (!video) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-secondary">Video not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()} className="p-2">
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
        </Pressable>
        <Text className="text-text-primary text-lg font-semibold">Edit</Text>
        <Pressable onPress={handleExport} className="p-2">
          <Text className="text-primary font-semibold">Export</Text>
        </Pressable>
      </View>

      {/* Video Player */}
      <VideoPlayer
        ref={videoRef}
        uri={video.uri}
        isPlaying={isPlaying}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onTogglePlay={handleTogglePlay}
      />

      {/* Timeline */}
      <Timeline
        duration={video.duration}
        currentTime={currentTime}
        trimStart={trimStart}
        trimEnd={trimEnd}
        onTrimStartChange={setTrimStart}
        onTrimEndChange={setTrimEnd}
        onSeek={seekTo}
      />

      {/* Speed Control */}
      <SpeedControl currentSpeed={speed} onSpeedChange={setSpeed} />

      {/* Music Picker */}
      <MusicPicker
        musicUri={musicUri}
        musicVolume={musicVolume}
        onMusicSelect={setMusic}
        onVolumeChange={setMusicVolume}
      />

      {/* Processing Modal */}
      <ProcessingModal
        visible={isProcessing}
        progress={processingProgress}
        step={processingStep}
        onCancel={handleCancelProcessing}
      />
    </SafeAreaView>
  );
}
