# Phase 4: Video Editing & FFmpeg Integration

## Context
- **Plan:** [plan.md](./plan.md)
- **Previous Phase:** [Phase 3: Recording & Camera](./phase-03-recording-camera.md)
- **Next Phase:** [Phase 5: Reel Creation](./phase-05-reel-creation.md)
- **Dependencies:** Phase 3 complete (videos saved locally)

## Overview
| Field | Value |
|-------|-------|
| Date | 2025-12-31 |
| Priority | P1 |
| Status | Pending |
| Effort | 10h |

## Key Insights
- ffmpeg-kit-react-native requires native build (prebuild)
- FFmpeg commands run asynchronously, need progress tracking
- Timeline UI = draggable trim handles on video scrubber
- Speed changes require re-encoding (not just playback rate)
- Music overlay = audio mix without re-encoding video track

## Requirements
1. Video player component with controls
2. Timeline UI with scrubber and trim handles
3. FFmpeg service for video operations
4. Trim functionality (cut start/end)
5. Speed control (0.5x - 2x)
6. Music overlay (local audio file)
7. Preview before export
8. Progress indicator during processing

## Architecture Decisions

### ADR-010: FFmpeg Command Strategy
**Decision:** Use ffmpeg-kit with async execution and progress callbacks
**Rationale:** Non-blocking UI, user feedback on long operations
**Consequences:** Need to handle cancellation, errors gracefully

### ADR-011: Video Editing State
**Decision:** Zustand store for edit state, separate from video store
**Rationale:** Transient state, doesn't need persistence until export
**Structure:** `{ videoId, trimStart, trimEnd, speed, musicUri }`

### ADR-012: Timeline Component
**Decision:** react-native-reanimated for gesture-based trim handles
**Rationale:** 60fps performance, native driver animations
**Consequences:** More complex gesture handling code

## Related Code Files

### New Files to Create
```
src/
  stores/
    editorStore.ts          # Edit session state
  lib/
    ffmpeg.ts               # FFmpeg command builder
    videoInfo.ts            # Get video metadata
  features/
    editor/
      EditorScreen.tsx      # Main editor screen
      VideoPlayer.tsx       # Video player with controls
      Timeline.tsx          # Scrubber with trim handles
      TrimHandle.tsx        # Draggable trim marker
      SpeedControl.tsx      # Speed selection UI
      MusicPicker.tsx       # Audio file picker
      ExportButton.tsx      # Process and save
      ProcessingModal.tsx   # Progress indicator
  hooks/
    useVideoPlayer.ts       # Player control hook
    useFFmpeg.ts            # FFmpeg execution hook
app/
  editor/
    [videoId].tsx           # Dynamic route for editing
```

## Implementation Steps

### Step 1: FFmpeg Service (60 min)

**src/lib/ffmpeg.ts:**
```typescript
import { FFmpegKit, FFmpegKitConfig, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';

export interface FFmpegProgress {
  time: number;
  percentage: number;
}

export interface ProcessingOptions {
  onProgress?: (progress: FFmpegProgress) => void;
  onComplete?: (outputPath: string) => void;
  onError?: (error: string) => void;
}

const OUTPUT_DIR = `${FileSystem.documentDirectory}processed/`;

async function ensureOutputDir() {
  const dirInfo = await FileSystem.getInfoAsync(OUTPUT_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(OUTPUT_DIR, { intermediates: true });
  }
}

function generateOutputPath(prefix: string = 'output'): string {
  return `${OUTPUT_DIR}${prefix}_${Date.now()}.mp4`;
}

/**
 * Trim video to specified start and end times
 */
export async function trimVideo(
  inputPath: string,
  startTime: number,
  endTime: number,
  options: ProcessingOptions = {}
): Promise<string> {
  await ensureOutputDir();
  const outputPath = generateOutputPath('trimmed');
  const duration = endTime - startTime;

  const command = [
    `-i "${inputPath}"`,
    `-ss ${startTime}`,
    `-t ${duration}`,
    `-c copy`, // Fast copy without re-encoding
    `-avoid_negative_ts 1`,
    `"${outputPath}"`,
  ].join(' ');

  return executeFFmpeg(command, duration, outputPath, options);
}

/**
 * Change video playback speed
 */
export async function changeSpeed(
  inputPath: string,
  speed: number,
  duration: number,
  options: ProcessingOptions = {}
): Promise<string> {
  await ensureOutputDir();
  const outputPath = generateOutputPath('speed');

  // Video: setpts filter, Audio: atempo filter
  // atempo only accepts 0.5-2.0, chain for extremes
  const videoFilter = `setpts=${1 / speed}*PTS`;
  let audioFilter = '';

  if (speed <= 2 && speed >= 0.5) {
    audioFilter = `atempo=${speed}`;
  } else if (speed > 2) {
    audioFilter = `atempo=2.0,atempo=${speed / 2}`;
  } else {
    audioFilter = `atempo=0.5,atempo=${speed / 0.5}`;
  }

  const command = [
    `-i "${inputPath}"`,
    `-filter_complex "[0:v]${videoFilter}[v];[0:a]${audioFilter}[a]"`,
    `-map "[v]"`,
    `-map "[a]"`,
    `-c:v libx264`,
    `-preset fast`,
    `-c:a aac`,
    `"${outputPath}"`,
  ].join(' ');

  const newDuration = duration / speed;
  return executeFFmpeg(command, newDuration, outputPath, options);
}

/**
 * Overlay audio track on video
 */
export async function addMusicOverlay(
  videoPath: string,
  audioPath: string,
  videoDuration: number,
  musicVolume: number = 0.3,
  originalVolume: number = 1.0,
  options: ProcessingOptions = {}
): Promise<string> {
  await ensureOutputDir();
  const outputPath = generateOutputPath('music');

  const command = [
    `-i "${videoPath}"`,
    `-i "${audioPath}"`,
    `-filter_complex`,
    `"[0:a]volume=${originalVolume}[a0];[1:a]volume=${musicVolume}[a1];[a0][a1]amix=inputs=2:duration=first[aout]"`,
    `-map 0:v`,
    `-map "[aout]"`,
    `-c:v copy`,
    `-c:a aac`,
    `-shortest`,
    `"${outputPath}"`,
  ].join(' ');

  return executeFFmpeg(command, videoDuration, outputPath, options);
}

/**
 * Execute FFmpeg command with progress tracking
 */
async function executeFFmpeg(
  command: string,
  expectedDuration: number,
  outputPath: string,
  options: ProcessingOptions
): Promise<string> {
  const { onProgress, onComplete, onError } = options;

  // Enable statistics callback for progress
  FFmpegKitConfig.enableStatisticsCallback((statistics) => {
    const time = statistics.getTime() / 1000; // Convert to seconds
    const percentage = Math.min((time / expectedDuration) * 100, 100);
    onProgress?.({ time, percentage });
  });

  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();

  if (ReturnCode.isSuccess(returnCode)) {
    onComplete?.(outputPath);
    return outputPath;
  } else {
    const logs = await session.getAllLogsAsString();
    const errorMsg = `FFmpeg failed: ${logs}`;
    onError?.(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Get video metadata
 */
export async function getVideoInfo(
  videoPath: string
): Promise<{ duration: number; width: number; height: number }> {
  const session = await FFmpegKit.execute(
    `-i "${videoPath}" -f null -`
  );

  const output = await session.getAllLogsAsString();

  // Parse duration from output
  const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
  let duration = 0;
  if (durationMatch) {
    const [, hours, minutes, seconds] = durationMatch;
    duration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
  }

  // Parse dimensions
  const dimensionMatch = output.match(/(\d{3,4})x(\d{3,4})/);
  let width = 1920,
    height = 1080;
  if (dimensionMatch) {
    width = parseInt(dimensionMatch[1]);
    height = parseInt(dimensionMatch[2]);
  }

  return { duration, width, height };
}

/**
 * Generate thumbnail from video
 */
export async function generateThumbnail(
  videoPath: string,
  timeSeconds: number = 0
): Promise<string> {
  await ensureOutputDir();
  const outputPath = generateOutputPath('thumb').replace('.mp4', '.jpg');

  const command = [
    `-i "${videoPath}"`,
    `-ss ${timeSeconds}`,
    `-vframes 1`,
    `-q:v 2`,
    `"${outputPath}"`,
  ].join(' ');

  await FFmpegKit.execute(command);
  return outputPath;
}

/**
 * Cancel all running FFmpeg sessions
 */
export function cancelAllFFmpegSessions() {
  FFmpegKit.cancel();
}
```

### Step 2: Editor Store (30 min)

**src/stores/editorStore.ts:**
```typescript
import { create } from 'zustand';
import type { VideoId } from '@/types';

interface EditorState {
  // Current editing session
  videoId: VideoId | null;
  videoUri: string | null;
  duration: number;

  // Edit parameters
  trimStart: number;
  trimEnd: number;
  speed: number;
  musicUri: string | null;
  musicVolume: number;

  // Processing state
  isProcessing: boolean;
  processingProgress: number;
  processingStep: string;

  // Actions
  initEditor: (videoId: VideoId, uri: string, duration: number) => void;
  setTrimStart: (time: number) => void;
  setTrimEnd: (time: number) => void;
  setSpeed: (speed: number) => void;
  setMusic: (uri: string | null) => void;
  setMusicVolume: (volume: number) => void;
  setProcessing: (isProcessing: boolean, step?: string) => void;
  setProcessingProgress: (progress: number) => void;
  resetEditor: () => void;
}

const initialState = {
  videoId: null,
  videoUri: null,
  duration: 0,
  trimStart: 0,
  trimEnd: 0,
  speed: 1,
  musicUri: null,
  musicVolume: 0.3,
  isProcessing: false,
  processingProgress: 0,
  processingStep: '',
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  initEditor: (videoId, uri, duration) =>
    set({
      videoId,
      videoUri: uri,
      duration,
      trimStart: 0,
      trimEnd: duration,
    }),

  setTrimStart: (time) => set({ trimStart: time }),
  setTrimEnd: (time) => set({ trimEnd: time }),
  setSpeed: (speed) => set({ speed }),
  setMusic: (uri) => set({ musicUri: uri }),
  setMusicVolume: (volume) => set({ musicVolume: volume }),

  setProcessing: (isProcessing, step = '') =>
    set({ isProcessing, processingStep: step, processingProgress: 0 }),

  setProcessingProgress: (progress) => set({ processingProgress: progress }),

  resetEditor: () => set(initialState),
}));
```

### Step 3: Video Player Hook (30 min)

**src/hooks/useVideoPlayer.ts:**
```typescript
import { useRef, useState, useCallback, useEffect } from 'react';
import { Video, AVPlaybackStatus } from 'expo-av';

interface UseVideoPlayerReturn {
  videoRef: React.RefObject<Video>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (time: number) => Promise<void>;
  setPlaybackSpeed: (rate: number) => Promise<void>;
}

export function useVideoPlayer(): UseVideoPlayerReturn {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setIsLoaded(false);
      return;
    }

    setIsLoaded(true);
    setIsPlaying(status.isPlaying);
    setCurrentTime(status.positionMillis / 1000);
    setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
  }, []);

  const play = useCallback(async () => {
    await videoRef.current?.playAsync();
  }, []);

  const pause = useCallback(async () => {
    await videoRef.current?.pauseAsync();
  }, []);

  const seekTo = useCallback(async (time: number) => {
    await videoRef.current?.setPositionAsync(time * 1000);
  }, []);

  const setPlaybackSpeed = useCallback(async (rate: number) => {
    await videoRef.current?.setRateAsync(rate, true);
  }, []);

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    isLoaded,
    play,
    pause,
    seekTo,
    setPlaybackSpeed,
  };
}
```

### Step 4: Video Player Component (45 min)

**src/features/editor/VideoPlayer.tsx:**
```typescript
import { View, Pressable } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { forwardRef } from 'react';
import { COLORS } from '@/lib/constants';

interface VideoPlayerProps {
  uri: string;
  isPlaying: boolean;
  onPlaybackStatusUpdate: (status: any) => void;
  onTogglePlay: () => void;
}

export const VideoPlayer = forwardRef<Video, VideoPlayerProps>(
  ({ uri, isPlaying, onPlaybackStatusUpdate, onTogglePlay }, ref) => {
    return (
      <View className="aspect-video bg-black relative">
        <Video
          ref={ref}
          source={{ uri }}
          style={{ flex: 1 }}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          shouldPlay={false}
          isLooping={false}
        />

        {/* Play/Pause Overlay */}
        <Pressable
          onPress={onTogglePlay}
          className="absolute inset-0 items-center justify-center"
        >
          {!isPlaying && (
            <View className="w-16 h-16 rounded-full bg-black/50 items-center justify-center">
              <Ionicons name="play" size={32} color={COLORS.textPrimary} />
            </View>
          )}
        </Pressable>
      </View>
    );
  }
);
```

### Step 5: Timeline Component (90 min)

**src/features/editor/Timeline.tsx:**
```typescript
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
```

### Step 6: Speed Control (30 min)

**src/features/editor/SpeedControl.tsx:**
```typescript
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
```

### Step 7: Music Picker (45 min)

**src/features/editor/MusicPicker.tsx:**
```typescript
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Slider from '@react-native-community/slider';
import { COLORS } from '@/lib/constants';

interface MusicPickerProps {
  musicUri: string | null;
  musicVolume: number;
  onMusicSelect: (uri: string | null) => void;
  onVolumeChange: (volume: number) => void;
}

export function MusicPicker({
  musicUri,
  musicVolume,
  onMusicSelect,
  onVolumeChange,
}: MusicPickerProps) {
  const handlePickMusic = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset?.uri) {
      onMusicSelect(asset.uri);
    }
  };

  const handleRemoveMusic = () => {
    onMusicSelect(null);
  };

  return (
    <View className="py-4 px-4">
      <Text className="text-text-secondary text-sm mb-2">Music Overlay</Text>

      {musicUri ? (
        <View className="bg-surface rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Ionicons name="musical-note" size={24} color={COLORS.secondary} />
              <Text className="text-text-primary ml-2" numberOfLines={1}>
                Audio Added
              </Text>
            </View>
            <Pressable onPress={handleRemoveMusic}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
            </Pressable>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="volume-low" size={20} color={COLORS.textSecondary} />
            <Slider
              style={{ flex: 1, marginHorizontal: 8 }}
              minimumValue={0}
              maximumValue={1}
              value={musicVolume}
              onValueChange={onVolumeChange}
              minimumTrackTintColor={COLORS.secondary}
              maximumTrackTintColor={COLORS.surfaceElevated}
              thumbTintColor={COLORS.secondary}
            />
            <Ionicons name="volume-high" size={20} color={COLORS.textSecondary} />
          </View>
        </View>
      ) : (
        <Pressable
          onPress={handlePickMusic}
          className="bg-surface rounded-xl p-4 flex-row items-center justify-center"
        >
          <Ionicons name="add" size={24} color={COLORS.textSecondary} />
          <Text className="text-text-secondary ml-2">Add Background Music</Text>
        </Pressable>
      )}
    </View>
  );
}
```

### Step 8: Processing Modal (30 min)

**src/features/editor/ProcessingModal.tsx:**
```typescript
import { Modal, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { COLORS } from '@/lib/constants';

interface ProcessingModalProps {
  visible: boolean;
  progress: number;
  step: string;
  onCancel: () => void;
}

export function ProcessingModal({
  visible,
  progress,
  step,
  onCancel,
}: ProcessingModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 items-center justify-center px-8">
        <View className="bg-surface w-full rounded-2xl p-6">
          <Text className="text-text-primary text-lg font-semibold text-center mb-2">
            Processing Video
          </Text>
          <Text className="text-text-secondary text-center mb-6">{step}</Text>

          {/* Progress Bar */}
          <View className="h-2 bg-surface-elevated rounded-full overflow-hidden mb-4">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>

          <Text className="text-text-secondary text-center mb-6">
            {Math.round(progress)}%
          </Text>

          <Pressable
            onPress={onCancel}
            className="bg-surface-elevated py-3 rounded-xl"
          >
            <Text className="text-error text-center font-medium">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
```

### Step 9: Editor Screen (90 min)

**src/features/editor/EditorScreen.tsx:**
```typescript
import { View, Alert } from 'react-native';
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
import { Pressable, Text } from 'react-native';
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
        onPlaybackStatusUpdate={() => {}}
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
```

### Step 10: Editor Route (10 min)

**app/editor/[videoId].tsx:**
```typescript
import { EditorScreen } from '@/features/editor/EditorScreen';

export default function EditorRoute() {
  return <EditorScreen />;
}
```

**app/editor/_layout.tsx:**
```typescript
import { Stack } from 'expo-router';

export default function EditorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'modal' }} />
  );
}
```

## Additional Dependencies

Add to package.json:
```bash
npx expo install @react-native-community/slider expo-document-picker
```

## Todo List
- [ ] Create src/lib/ffmpeg.ts
- [ ] Create src/stores/editorStore.ts
- [ ] Create src/hooks/useVideoPlayer.ts
- [ ] Create src/features/editor/VideoPlayer.tsx
- [ ] Create src/features/editor/Timeline.tsx
- [ ] Create src/features/editor/SpeedControl.tsx
- [ ] Create src/features/editor/MusicPicker.tsx
- [ ] Create src/features/editor/ProcessingModal.tsx
- [ ] Create src/features/editor/EditorScreen.tsx
- [ ] Create app/editor/[videoId].tsx
- [ ] Create app/editor/_layout.tsx
- [ ] Install slider and document-picker
- [ ] Run `npx expo prebuild` for FFmpeg
- [ ] Test trim functionality
- [ ] Test speed change
- [ ] Test music overlay
- [ ] Test export flow

## Success Criteria
- [ ] Video player loads and plays recorded videos
- [ ] Timeline shows current position and allows seeking
- [ ] Trim handles adjust start/end times
- [ ] Speed control changes playback rate
- [ ] Music picker selects audio files
- [ ] Export processes video with all edits
- [ ] Progress modal shows accurate percentage
- [ ] Cancel stops FFmpeg processing

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| FFmpeg slow on device | Medium | High | Use `-preset fast`, show progress |
| Memory issues large videos | Medium | High | Process in chunks, limit resolution |
| Audio sync issues | Low | Medium | Test thoroughly, adjust filter params |
| Gesture conflicts | Low | Medium | Careful gesture handler setup |

## Security Considerations
- Document picker restricted to audio/* types
- Processed files in app sandbox
- No network upload in this phase

## Next Steps
After completing Phase 4:
1. Proceed to [Phase 5: Reel Creation](./phase-05-reel-creation.md)
2. Build clip selection UI
3. Implement FFmpeg concat for multiple clips
4. Add reel preview and export
