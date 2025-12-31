# Phase 3: Recording & Camera Features

## Context
- **Plan:** [plan.md](./plan.md)
- **Previous Phase:** [Phase 2: Auth & Infrastructure](./phase-02-auth-infrastructure.md)
- **Next Phase:** [Phase 4: Video Editing](./phase-04-video-editing.md)
- **Dependencies:** Phase 2 complete (auth flow, protected routes)

## Overview
| Field | Value |
|-------|-------|
| Date | 2025-12-31 |
| Priority | P1 |
| Status | Needs Fixes |
| Effort | 8h |
| Code Review | [Report](../reports/code-reviewer-251231-1123-phase3-recording-camera.md) |

## Key Insights
- expo-camera v17 API has changed (CameraView component)
- Permissions must be requested before camera access
- Highlight tagging = timestamp markers during recording
- Videos saved to app's document directory, not camera roll initially
- Large video files need chunked writing strategy

## Requirements
1. Camera permissions handling (camera + microphone)
2. Camera preview with recording controls
3. Tap-to-tag highlight during recording
4. Visual feedback for highlights (pulse animation)
5. Save video to local filesystem
6. Video store for managing recordings

## Architecture Decisions

### ADR-007: Camera Component
**Decision:** Use expo-camera CameraView with ref-based recording
**Rationale:** Expo SDK 54 compatible, unified iOS/Android API
**Consequences:** Requires CameraView ref for recordAsync()

### ADR-008: Highlight Storage
**Decision:** Store highlights as timestamp array alongside video metadata
**Rationale:** Simple, efficient, allows re-editing
**Structure:** `{ videoId, timestamp, duration }`

### ADR-009: Video File Management
**Decision:** Store in `documentDirectory/videos/` with UUID filenames
**Rationale:** Persists across app updates, not synced to iCloud
**Consequences:** Manual cleanup needed on video deletion

## Related Code Files

### New Files to Create
```
src/
  stores/
    videoStore.ts           # Video/highlight state management
  hooks/
    useCamera.ts            # Camera permission & control hook
    useRecording.ts         # Recording state machine
  features/
    record/
      RecordScreen.tsx      # Main recording screen
      CameraControls.tsx    # Record/stop/tag buttons
      HighlightIndicator.tsx # Visual tag feedback
      RecordingTimer.tsx    # Duration display
  lib/
    videoStorage.ts         # File system operations
app/
  (tabs)/
    record.tsx              # Route to RecordScreen
```

## Implementation Steps

### Step 1: Video Store (45 min)

**src/stores/videoStore.ts:**
```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '@/lib/storage';
import type { Video, Highlight, VideoId, HighlightId } from '@/types';

interface VideoState {
  videos: Video[];
  currentRecording: {
    isRecording: boolean;
    startTime: number | null;
    highlights: { timestamp: number }[];
  };

  // Actions
  addVideo: (video: Video) => void;
  removeVideo: (id: VideoId) => void;
  addHighlight: (videoId: VideoId, highlight: Highlight) => void;
  removeHighlight: (videoId: VideoId, highlightId: HighlightId) => void;

  // Recording actions
  startRecording: () => void;
  stopRecording: () => void;
  tagHighlight: () => void;
  resetRecording: () => void;
}

const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: unknown) => {
    storage.set(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

export const useVideoStore = create<VideoState>()(
  persist(
    (set, get) => ({
      videos: [],
      currentRecording: {
        isRecording: false,
        startTime: null,
        highlights: [],
      },

      addVideo: (video) =>
        set((state) => ({ videos: [video, ...state.videos] })),

      removeVideo: (id) =>
        set((state) => ({
          videos: state.videos.filter((v) => v.id !== id),
        })),

      addHighlight: (videoId, highlight) =>
        set((state) => ({
          videos: state.videos.map((v) =>
            v.id === videoId
              ? { ...v, highlights: [...v.highlights, highlight] }
              : v
          ),
        })),

      removeHighlight: (videoId, highlightId) =>
        set((state) => ({
          videos: state.videos.map((v) =>
            v.id === videoId
              ? {
                  ...v,
                  highlights: v.highlights.filter((h) => h.id !== highlightId),
                }
              : v
          ),
        })),

      startRecording: () =>
        set({
          currentRecording: {
            isRecording: true,
            startTime: Date.now(),
            highlights: [],
          },
        }),

      stopRecording: () =>
        set((state) => ({
          currentRecording: {
            ...state.currentRecording,
            isRecording: false,
          },
        })),

      tagHighlight: () => {
        const { currentRecording } = get();
        if (!currentRecording.isRecording || !currentRecording.startTime) return;

        const timestamp = (Date.now() - currentRecording.startTime) / 1000;
        set({
          currentRecording: {
            ...currentRecording,
            highlights: [...currentRecording.highlights, { timestamp }],
          },
        });
      },

      resetRecording: () =>
        set({
          currentRecording: {
            isRecording: false,
            startTime: null,
            highlights: [],
          },
        }),
    }),
    {
      name: 'video-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ videos: state.videos }),
    }
  )
);
```

### Step 2: Video Storage Utilities (30 min)

**src/lib/videoStorage.ts:**
```typescript
import * as FileSystem from 'expo-file-system';
import { Video, Highlight } from '@/types';
import { VIDEO } from './constants';

const VIDEO_DIR = `${FileSystem.documentDirectory}videos/`;

export async function ensureVideoDirectory() {
  const dirInfo = await FileSystem.getInfoAsync(VIDEO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(VIDEO_DIR, { intermediates: true });
  }
}

export function generateVideoId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getVideoPath(videoId: string): string {
  return `${VIDEO_DIR}${videoId}.mp4`;
}

export async function saveVideo(
  tempUri: string,
  videoId: string
): Promise<string> {
  await ensureVideoDirectory();
  const destPath = getVideoPath(videoId);
  await FileSystem.moveAsync({ from: tempUri, to: destPath });
  return destPath;
}

export async function deleteVideo(videoId: string): Promise<void> {
  const videoPath = getVideoPath(videoId);
  const fileInfo = await FileSystem.getInfoAsync(videoPath);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(videoPath);
  }

  // Also delete thumbnail if exists
  const thumbPath = getThumbnailPath(videoId);
  const thumbInfo = await FileSystem.getInfoAsync(thumbPath);
  if (thumbInfo.exists) {
    await FileSystem.deleteAsync(thumbPath);
  }
}

export function getThumbnailPath(videoId: string): string {
  return `${VIDEO_DIR}${videoId}_thumb.jpg`;
}

export async function getVideoFileSize(videoId: string): Promise<number> {
  const videoPath = getVideoPath(videoId);
  const fileInfo = await FileSystem.getInfoAsync(videoPath, { size: true });
  return fileInfo.exists && fileInfo.size ? fileInfo.size : 0;
}

export function createVideoMetadata(
  videoId: string,
  uri: string,
  duration: number,
  highlights: { timestamp: number }[]
): Video {
  return {
    id: videoId,
    uri,
    duration,
    createdAt: new Date(),
    highlights: highlights.map((h, i) => ({
      id: `hl_${videoId}_${i}`,
      videoId,
      timestamp: h.timestamp,
      duration: VIDEO.defaultHighlightDuration,
    })),
  };
}
```

### Step 3: Camera Hook (45 min)

**src/hooks/useCamera.ts:**
```typescript
import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, CameraView, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

interface UseCameraReturn {
  cameraRef: React.RefObject<CameraView>;
  hasPermission: boolean | null;
  isReady: boolean;
  facing: CameraType;
  requestPermission: () => Promise<boolean>;
  toggleFacing: () => void;
}

export function useCamera(): UseCameraReturn {
  const cameraRef = useRef<CameraView>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status: cameraStatus } = await Camera.getCameraPermissionsAsync();
    const { status: audioStatus } = await Camera.getMicrophonePermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.getPermissionsAsync();

    const hasAll =
      cameraStatus === 'granted' &&
      audioStatus === 'granted' &&
      mediaStatus === 'granted';

    setHasPermission(hasAll);
  };

  const requestPermission = useCallback(async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();

    const hasAll =
      cameraStatus === 'granted' &&
      audioStatus === 'granted' &&
      mediaStatus === 'granted';

    setHasPermission(hasAll);
    return hasAll;
  }, []);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  return {
    cameraRef,
    hasPermission,
    isReady,
    facing,
    requestPermission,
    toggleFacing,
  };
}
```

### Step 4: Recording Hook (60 min)

**src/hooks/useRecording.ts:**
```typescript
import { useState, useCallback, useRef } from 'react';
import { CameraView } from 'expo-camera';
import { useVideoStore } from '@/stores/videoStore';
import {
  saveVideo,
  generateVideoId,
  createVideoMetadata,
} from '@/lib/videoStorage';

interface UseRecordingReturn {
  isRecording: boolean;
  duration: number;
  highlightCount: number;
  startRecording: (cameraRef: React.RefObject<CameraView>) => Promise<void>;
  stopRecording: () => Promise<void>;
  tagHighlight: () => void;
}

export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cameraRefLocal = useRef<CameraView | null>(null);

  const {
    currentRecording,
    startRecording: storeStartRecording,
    stopRecording: storeStopRecording,
    tagHighlight: storeTagHighlight,
    resetRecording,
    addVideo,
  } = useVideoStore();

  const startRecording = useCallback(
    async (cameraRef: React.RefObject<CameraView>) => {
      if (!cameraRef.current || isRecording) return;

      cameraRefLocal.current = cameraRef.current;
      setIsRecording(true);
      storeStartRecording();
      setDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      try {
        const video = await cameraRef.current.recordAsync({
          maxDuration: 600, // 10 minutes max
        });

        // Recording stopped, process video
        if (video?.uri) {
          const videoId = generateVideoId();
          const savedUri = await saveVideo(video.uri, videoId);

          const videoMetadata = createVideoMetadata(
            videoId,
            savedUri,
            duration,
            currentRecording.highlights
          );

          addVideo(videoMetadata);
        }
      } catch (error) {
        console.error('Recording error:', error);
      } finally {
        resetRecording();
      }
    },
    [isRecording, duration, currentRecording.highlights]
  );

  const stopRecording = useCallback(async () => {
    if (!cameraRefLocal.current || !isRecording) return;

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    storeStopRecording();

    // Stop camera recording
    cameraRefLocal.current.stopRecording();
  }, [isRecording]);

  const tagHighlight = useCallback(() => {
    if (!isRecording) return;
    storeTagHighlight();
  }, [isRecording]);

  return {
    isRecording,
    duration,
    highlightCount: currentRecording.highlights.length,
    startRecording,
    stopRecording,
    tagHighlight,
  };
}
```

### Step 5: Camera Controls Component (45 min)

**src/features/record/CameraControls.tsx:**
```typescript
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
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
    <View className="absolute bottom-0 left-0 right-0 pb-12 pt-6 bg-gradient-to-t from-black/80 to-transparent">
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
```

### Step 6: Recording Timer (20 min)

**src/features/record/RecordingTimer.tsx:**
```typescript
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
```

### Step 7: Highlight Indicator (30 min)

**src/features/record/HighlightIndicator.tsx:**
```typescript
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
```

### Step 8: Record Screen (60 min)

**src/features/record/RecordScreen.tsx:**
```typescript
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
  }, [cameraRef]);

  const handleTagHighlight = useCallback(() => {
    tagHighlight();
    setShowHighlightIndicator(true);
  }, []);

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
```

### Step 9: Wire Up Route (15 min)

**app/(tabs)/record.tsx:**
```typescript
import { RecordScreen } from '@/features/record/RecordScreen';

export default function RecordTab() {
  return <RecordScreen />;
}
```

**app/(tabs)/gallery.tsx:** (placeholder)
```typescript
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GalleryTab() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-primary text-xl">Gallery</Text>
        <Text className="text-text-secondary mt-2">Coming in Phase 6</Text>
      </View>
    </SafeAreaView>
  );
}
```

## Todo List

### Implementation (Complete)
- [x] Create src/stores/videoStore.ts
- [x] Create src/lib/videoStorage.ts
- [x] Create src/hooks/useCamera.ts
- [x] Create src/hooks/useRecording.ts
- [x] Create src/features/record/CameraControls.tsx
- [x] Create src/features/record/RecordingTimer.tsx
- [x] Create src/features/record/HighlightIndicator.tsx
- [x] Create src/features/record/RecordScreen.tsx
- [x] Create app/(tabs)/record.tsx

### Critical Fixes (Required Before Phase 4)
- [ ] **C1:** Fix timer cleanup memory leak in useRecording.ts
- [ ] **C2:** Fix stale closure in startRecording dependencies
- [ ] **C3:** Remove unsafe FileSystem type casting
- [ ] **C4:** Add error boundaries around camera components
- [ ] **H5:** Fix getVideoFileSize API usage

### High Priority Fixes (Before Production)
- [ ] **H1:** Add video file size validation
- [ ] **H2:** Fix timer accuracy using elapsed time
- [ ] **H3:** Add camera mount delay for isReady state
- [ ] **H4:** Add temp file cleanup on save failure
- [ ] **H6:** Add store rehydration cleanup

### Medium Priority (Recommended)
- [ ] **M1:** Add accessibility labels to controls
- [ ] **M2:** Replace emoji with Ionicons
- [ ] **M3:** Add haptic feedback
- [ ] **M5:** Use Math.floor for timestamp precision
- [ ] **M6:** Fix Date serialization in video metadata

### Testing
- [ ] Test camera permissions flow
- [ ] Test recording start/stop with fixes applied
- [ ] Test highlight tagging accuracy
- [ ] Test video file saving with validation
- [ ] Verify highlights persist correctly
- [ ] Test edge cases (background, rotation, low storage)

## Success Criteria
- [x] Camera preview renders full screen
- [x] Permissions request shows on first launch
- [x] Recording starts with visual feedback (timer, red dot)
- [x] Tap-to-tag creates highlight with animation
- [⚠] Stopping recording saves video to filesystem (needs validation fix)
- [⚠] Video metadata with highlights saved to store (needs stale closure fix)
- [x] Camera flip works when not recording
- [ ] All critical bugs (C1-C4) resolved
- [ ] Error handling comprehensive
- [ ] Manual test cases pass

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Camera API changes | Low | High | Pin expo-camera version |
| Recording fails silently | Medium | High | Add error boundary, logging |
| Memory issues with long videos | Medium | Medium | Set max duration limit |
| Permission persistence | Low | Medium | Check permissions on mount |

## Security Considerations
- Videos stored in app sandbox, not accessible to other apps
- No cloud upload in this phase (local only)
- Camera/mic permissions clearly explained to user

## Next Steps
After completing Phase 3:
1. Proceed to [Phase 4: Video Editing](./phase-04-video-editing.md)
2. Implement video player component
3. Build timeline UI with trim functionality
4. Integrate FFmpeg for video processing
