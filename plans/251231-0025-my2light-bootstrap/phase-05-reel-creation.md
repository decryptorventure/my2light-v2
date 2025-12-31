# Phase 5: Reel Creation & Sharing

## Context
- **Plan:** [plan.md](./plan.md)
- **Previous Phase:** [Phase 4: Video Editing](./phase-04-video-editing.md)
- **Next Phase:** [Phase 6: Gallery & Polish](./phase-06-gallery-polish.md)
- **Dependencies:** Phase 4 complete (FFmpeg integration, video editing)

## Overview
| Field | Value |
|-------|-------|
| Date | 2025-12-31 |
| Priority | P1 |
| Status | Pending |
| Effort | 6h |

## Key Insights
- Reel = concatenation of multiple video clips
- FFmpeg concat demuxer requires file list
- Order of clips matters (drag-to-reorder UX)
- Share uses expo-sharing for native share sheet
- Can save to camera roll via expo-media-library

## Requirements
1. Clip selection UI (multi-select from gallery)
2. Clip reordering (drag and drop)
3. FFmpeg concat for multiple clips
4. Reel preview before export
5. Share to native share sheet
6. Save to camera roll option

## Architecture Decisions

### ADR-013: Reel State Management
**Decision:** Zustand store for reel creation session
**Rationale:** Track selected clips, order, export state
**Structure:** `{ clips: Clip[], selectedIds: string[] }`

### ADR-014: FFmpeg Concat Strategy
**Decision:** Use concat demuxer with file list
**Rationale:** Fast, no re-encoding if codecs match
**Fallback:** Re-encode if codecs differ

### ADR-015: Drag Reorder Implementation
**Decision:** react-native-reanimated + gesture handler
**Rationale:** 60fps performance, native feel
**Alternative considered:** react-native-draggable-flatlist

## Related Code Files

### New Files to Create
```
src/
  stores/
    reelStore.ts            # Reel creation state
  lib/
    sharing.ts              # Share/save utilities
  features/
    reel/
      ReelCreatorScreen.tsx # Main reel creation screen
      ClipSelector.tsx      # Multi-select clip picker
      ClipList.tsx          # Draggable clip list
      ClipItem.tsx          # Single clip in list
      ReelPreview.tsx       # Preview concatenated reel
app/
  reel/
    index.tsx               # Reel creator entry
    preview.tsx             # Reel preview screen
```

## Implementation Steps

### Step 1: Reel Store (30 min)

**src/stores/reelStore.ts:**
```typescript
import { create } from 'zustand';
import type { VideoId, Clip } from '@/types';

interface ReelClip {
  id: string;
  videoId: VideoId;
  videoUri: string;
  thumbnailUri?: string;
  duration: number;
  order: number;
}

interface ReelState {
  clips: ReelClip[];
  isProcessing: boolean;
  processingProgress: number;
  exportedUri: string | null;

  // Actions
  addClip: (clip: Omit<ReelClip, 'order'>) => void;
  removeClip: (id: string) => void;
  reorderClips: (fromIndex: number, toIndex: number) => void;
  clearClips: () => void;
  setProcessing: (processing: boolean) => void;
  setProgress: (progress: number) => void;
  setExportedUri: (uri: string | null) => void;
  reset: () => void;
}

const initialState = {
  clips: [],
  isProcessing: false,
  processingProgress: 0,
  exportedUri: null,
};

export const useReelStore = create<ReelState>((set, get) => ({
  ...initialState,

  addClip: (clip) =>
    set((state) => ({
      clips: [...state.clips, { ...clip, order: state.clips.length }],
    })),

  removeClip: (id) =>
    set((state) => ({
      clips: state.clips
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, order: i })),
    })),

  reorderClips: (fromIndex, toIndex) =>
    set((state) => {
      const newClips = [...state.clips];
      const [moved] = newClips.splice(fromIndex, 1);
      newClips.splice(toIndex, 0, moved);
      return {
        clips: newClips.map((c, i) => ({ ...c, order: i })),
      };
    }),

  clearClips: () => set({ clips: [] }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setProgress: (processingProgress) => set({ processingProgress }),
  setExportedUri: (exportedUri) => set({ exportedUri }),
  reset: () => set(initialState),
}));
```

### Step 2: Sharing Utilities (30 min)

**src/lib/sharing.ts:**
```typescript
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export async function shareVideo(videoUri: string): Promise<boolean> {
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(videoUri, {
    mimeType: 'video/mp4',
    dialogTitle: 'Share your highlight reel',
    UTI: 'public.movie',
  });

  return true;
}

export async function saveToCameraRoll(videoUri: string): Promise<string> {
  const { status } = await MediaLibrary.requestPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Media library permission required');
  }

  const asset = await MediaLibrary.createAssetAsync(videoUri);

  // Optionally create an album
  const album = await MediaLibrary.getAlbumAsync('My2Light');
  if (album) {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  } else {
    await MediaLibrary.createAlbumAsync('My2Light', asset, false);
  }

  return asset.uri;
}

export async function getFileSize(uri: string): Promise<string> {
  const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });

  if (!fileInfo.exists || !fileInfo.size) {
    return 'Unknown';
  }

  const bytes = fileInfo.size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

### Step 3: FFmpeg Concat (45 min)

Add to **src/lib/ffmpeg.ts:**
```typescript
/**
 * Concatenate multiple video clips into one
 */
export async function concatenateVideos(
  videoPaths: string[],
  options: ProcessingOptions = {}
): Promise<string> {
  await ensureOutputDir();
  const outputPath = generateOutputPath('reel');

  // Create file list for concat demuxer
  const fileListPath = `${OUTPUT_DIR}concat_list.txt`;
  const fileListContent = videoPaths
    .map((path) => `file '${path}'`)
    .join('\n');

  await FileSystem.writeAsStringAsync(fileListPath, fileListContent);

  // Calculate total duration for progress
  let totalDuration = 0;
  for (const path of videoPaths) {
    const info = await getVideoInfo(path);
    totalDuration += info.duration;
  }

  const command = [
    `-f concat`,
    `-safe 0`,
    `-i "${fileListPath}"`,
    `-c copy`, // Fast copy without re-encoding
    `"${outputPath}"`,
  ].join(' ');

  try {
    return await executeFFmpeg(command, totalDuration, outputPath, options);
  } finally {
    // Cleanup file list
    await FileSystem.deleteAsync(fileListPath, { idempotent: true });
  }
}

/**
 * Concatenate with re-encoding (for mixed codecs)
 */
export async function concatenateVideosWithReencode(
  videoPaths: string[],
  options: ProcessingOptions = {}
): Promise<string> {
  await ensureOutputDir();
  const outputPath = generateOutputPath('reel');

  // Create filter complex for concat
  const inputs = videoPaths.map((p, i) => `-i "${p}"`).join(' ');
  const filterInputs = videoPaths.map((_, i) => `[${i}:v][${i}:a]`).join('');

  // Calculate total duration
  let totalDuration = 0;
  for (const path of videoPaths) {
    const info = await getVideoInfo(path);
    totalDuration += info.duration;
  }

  const command = [
    inputs,
    `-filter_complex "${filterInputs}concat=n=${videoPaths.length}:v=1:a=1[outv][outa]"`,
    `-map "[outv]"`,
    `-map "[outa]"`,
    `-c:v libx264`,
    `-preset fast`,
    `-c:a aac`,
    `"${outputPath}"`,
  ].join(' ');

  return executeFFmpeg(command, totalDuration, outputPath, options);
}
```

### Step 4: Clip Item Component (30 min)

**src/features/reel/ClipItem.tsx:**
```typescript
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '@/lib/constants';

interface ClipItemProps {
  thumbnailUri?: string;
  duration: number;
  order: number;
  isActive?: boolean;
  onRemove: () => void;
}

export function ClipItem({
  thumbnailUri,
  duration,
  order,
  isActive,
  onRemove,
}: ClipItemProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isActive ? 1.05 : 1) }],
  }));

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View
      style={animatedStyle}
      className="flex-row items-center bg-surface rounded-xl p-3 mb-2"
    >
      {/* Drag Handle */}
      <View className="pr-3">
        <Ionicons name="menu" size={24} color={COLORS.textSecondary} />
      </View>

      {/* Thumbnail */}
      <View className="w-20 h-12 rounded-lg bg-surface-elevated overflow-hidden">
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} className="w-full h-full" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="videocam" size={20} color={COLORS.textSecondary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1 ml-3">
        <Text className="text-text-primary font-medium">Clip {order + 1}</Text>
        <Text className="text-text-secondary text-sm">
          {formatDuration(duration)}
        </Text>
      </View>

      {/* Remove Button */}
      <Pressable onPress={onRemove} className="p-2">
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </Pressable>
    </Animated.View>
  );
}
```

### Step 5: Clip List with Drag Reorder (60 min)

**src/features/reel/ClipList.tsx:**
```typescript
import { View, Text } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useReelStore } from '@/stores/reelStore';
import { ClipItem } from './ClipItem';

const ITEM_HEIGHT = 76; // height + margin

export function ClipList() {
  const { clips, removeClip, reorderClips } = useReelStore();
  const activeIndex = useSharedValue<number | null>(null);
  const translateY = useSharedValue(0);

  const handleRemove = (id: string) => {
    removeClip(id);
  };

  const handleReorder = (from: number, to: number) => {
    reorderClips(from, to);
  };

  if (clips.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-secondary">No clips selected</Text>
        <Text className="text-text-secondary text-sm mt-1">
          Tap videos to add them to your reel
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 px-4">
      <Text className="text-text-secondary text-sm mb-2">
        Drag to reorder • {clips.length} clip{clips.length !== 1 ? 's' : ''}
      </Text>

      {clips.map((clip, index) => {
        const panGesture = Gesture.Pan()
          .onStart(() => {
            activeIndex.value = index;
          })
          .onUpdate((e) => {
            translateY.value = e.translationY;
            const newIndex = Math.max(
              0,
              Math.min(
                clips.length - 1,
                index + Math.round(e.translationY / ITEM_HEIGHT)
              )
            );
            if (newIndex !== index && activeIndex.value === index) {
              runOnJS(handleReorder)(index, newIndex);
              activeIndex.value = newIndex;
            }
          })
          .onEnd(() => {
            activeIndex.value = null;
            translateY.value = withSpring(0);
          });

        const animatedStyle = useAnimatedStyle(() => ({
          transform: [
            {
              translateY:
                activeIndex.value === index ? translateY.value : 0,
            },
          ],
          zIndex: activeIndex.value === index ? 100 : 0,
        }));

        return (
          <GestureDetector key={clip.id} gesture={panGesture}>
            <Animated.View style={animatedStyle}>
              <ClipItem
                thumbnailUri={clip.thumbnailUri}
                duration={clip.duration}
                order={clip.order}
                isActive={activeIndex.value === index}
                onRemove={() => handleRemove(clip.id)}
              />
            </Animated.View>
          </GestureDetector>
        );
      })}

      {/* Total Duration */}
      <View className="mt-4 py-3 border-t border-surface-elevated">
        <Text className="text-text-secondary text-center">
          Total Duration:{' '}
          <Text className="text-text-primary font-medium">
            {formatTotalDuration(clips.reduce((sum, c) => sum + c.duration, 0))}
          </Text>
        </Text>
      </View>
    </View>
  );
}

function formatTotalDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

### Step 6: Clip Selector (45 min)

**src/features/reel/ClipSelector.tsx:**
```typescript
import { View, Text, FlatList, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoStore } from '@/stores/videoStore';
import { useReelStore } from '@/stores/reelStore';
import { COLORS } from '@/lib/constants';

export function ClipSelector() {
  const { videos } = useVideoStore();
  const { clips, addClip } = useReelStore();

  const selectedIds = clips.map((c) => c.videoId);

  const handleSelect = (video: typeof videos[0]) => {
    if (selectedIds.includes(video.id)) return;

    addClip({
      id: `${video.id}_${Date.now()}`,
      videoId: video.id,
      videoUri: video.uri,
      thumbnailUri: video.thumbnailUri,
      duration: video.duration,
    });
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View className="flex-1">
      <Text className="text-text-secondary text-sm px-4 mb-2">
        Select videos to add to reel
      </Text>

      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ padding: 8 }}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);

          return (
            <Pressable
              onPress={() => handleSelect(item)}
              className="flex-1 aspect-square m-1 rounded-lg overflow-hidden"
              style={{ maxWidth: '31%' }}
            >
              {item.thumbnailUri ? (
                <Image
                  source={{ uri: item.thumbnailUri }}
                  className="w-full h-full"
                />
              ) : (
                <View className="w-full h-full bg-surface items-center justify-center">
                  <Ionicons name="videocam" size={32} color={COLORS.textSecondary} />
                </View>
              )}

              {/* Duration Badge */}
              <View className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded">
                <Text className="text-white text-xs">
                  {formatDuration(item.duration)}
                </Text>
              </View>

              {/* Selected Overlay */}
              {isSelected && (
                <View className="absolute inset-0 bg-primary/50 items-center justify-center">
                  <Ionicons name="checkmark-circle" size={32} color="white" />
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-text-secondary">No videos yet</Text>
            <Text className="text-text-secondary text-sm mt-1">
              Record some highlights first
            </Text>
          </View>
        }
      />
    </View>
  );
}
```

### Step 7: Reel Creator Screen (60 min)

**src/features/reel/ReelCreatorScreen.tsx:**
```typescript
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useReelStore } from '@/stores/reelStore';
import { concatenateVideos } from '@/lib/ffmpeg';
import { ClipSelector } from './ClipSelector';
import { ClipList } from './ClipList';
import { ProcessingModal } from '@/features/editor/ProcessingModal';
import { COLORS } from '@/lib/constants';

type Tab = 'select' | 'order';

export function ReelCreatorScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('select');
  const {
    clips,
    isProcessing,
    processingProgress,
    setProcessing,
    setProgress,
    setExportedUri,
    reset,
  } = useReelStore();

  const handleCreateReel = async () => {
    if (clips.length < 2) {
      Alert.alert('Not Enough Clips', 'Select at least 2 clips to create a reel.');
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const videoPaths = clips
        .sort((a, b) => a.order - b.order)
        .map((c) => c.videoUri);

      const outputUri = await concatenateVideos(videoPaths, {
        onProgress: (p) => setProgress(p.percentage),
        onComplete: (uri) => {
          setExportedUri(uri);
          setProcessing(false);
          router.push('/reel/preview');
        },
        onError: (error) => {
          throw new Error(error);
        },
      });
    } catch (error) {
      setProcessing(false);
      Alert.alert('Error', 'Failed to create reel. Please try again.');
      console.error('Reel creation error:', error);
    }
  };

  const handleCancel = () => {
    setProcessing(false);
  };

  const handleClose = () => {
    Alert.alert(
      'Discard Reel?',
      'Your clip selection will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            reset();
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={handleClose} className="p-2">
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
        </Pressable>
        <Text className="text-text-primary text-lg font-semibold">
          Create Reel
        </Text>
        <Pressable
          onPress={handleCreateReel}
          disabled={clips.length < 2}
          className="p-2"
        >
          <Text
            className={`font-semibold ${
              clips.length < 2 ? 'text-text-secondary' : 'text-primary'
            }`}
          >
            Create
          </Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mb-4">
        <Pressable
          onPress={() => setActiveTab('select')}
          className={`flex-1 py-3 rounded-lg mr-2 ${
            activeTab === 'select' ? 'bg-primary' : 'bg-surface'
          }`}
        >
          <Text
            className={`text-center font-medium ${
              activeTab === 'select' ? 'text-white' : 'text-text-secondary'
            }`}
          >
            Select ({clips.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('order')}
          className={`flex-1 py-3 rounded-lg ml-2 ${
            activeTab === 'order' ? 'bg-primary' : 'bg-surface'
          }`}
        >
          <Text
            className={`text-center font-medium ${
              activeTab === 'order' ? 'text-white' : 'text-text-secondary'
            }`}
          >
            Order
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {activeTab === 'select' ? <ClipSelector /> : <ClipList />}

      {/* Processing Modal */}
      <ProcessingModal
        visible={isProcessing}
        progress={processingProgress}
        step="Creating your reel..."
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
}
```

### Step 8: Reel Preview Screen (45 min)

**src/features/reel/ReelPreview.tsx:**
```typescript
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { useRef, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useReelStore } from '@/stores/reelStore';
import { shareVideo, saveToCameraRoll, getFileSize } from '@/lib/sharing';
import { COLORS } from '@/lib/constants';

export function ReelPreview() {
  const videoRef = useRef<Video>(null);
  const { exportedUri, reset } = useReelStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileSize, setFileSize] = useState<string>('');

  useEffect(() => {
    if (exportedUri) {
      getFileSize(exportedUri).then(setFileSize);
    }
  }, [exportedUri]);

  if (!exportedUri) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-secondary">No reel to preview</Text>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      await shareVideo(exportedUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to share video');
    }
  };

  const handleSave = async () => {
    try {
      await saveToCameraRoll(exportedUri);
      Alert.alert('Saved!', 'Reel saved to your camera roll');
    } catch (error) {
      Alert.alert('Error', 'Failed to save video');
    }
  };

  const handleDone = () => {
    reset();
    router.replace('/(tabs)/gallery');
  };

  const togglePlay = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={handleDone} className="p-2">
          <Ionicons name="checkmark" size={28} color={COLORS.primary} />
        </Pressable>
        <Text className="text-text-primary text-lg font-semibold">
          Your Reel
        </Text>
        <View className="w-10" />
      </View>

      {/* Video Player */}
      <Pressable onPress={togglePlay} className="flex-1">
        <Video
          ref={videoRef}
          source={{ uri: exportedUri }}
          style={{ flex: 1 }}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
            }
          }}
          isLooping
        />
        {!isPlaying && (
          <View className="absolute inset-0 items-center justify-center">
            <View className="w-20 h-20 rounded-full bg-black/50 items-center justify-center">
              <Ionicons name="play" size={40} color="white" />
            </View>
          </View>
        )}
      </Pressable>

      {/* File Info */}
      <View className="px-4 py-2">
        <Text className="text-text-secondary text-center text-sm">
          File size: {fileSize}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row px-4 pb-4 gap-4">
        <Pressable
          onPress={handleSave}
          className="flex-1 bg-surface py-4 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="download-outline" size={24} color={COLORS.textPrimary} />
          <Text className="text-text-primary font-medium ml-2">Save</Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          className="flex-1 bg-primary py-4 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="share-outline" size={24} color="white" />
          <Text className="text-white font-medium ml-2">Share</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

### Step 9: Routes (15 min)

**app/reel/index.tsx:**
```typescript
import { ReelCreatorScreen } from '@/features/reel/ReelCreatorScreen';

export default function ReelCreatorRoute() {
  return <ReelCreatorScreen />;
}
```

**app/reel/preview.tsx:**
```typescript
import { ReelPreview } from '@/features/reel/ReelPreview';

export default function ReelPreviewRoute() {
  return <ReelPreview />;
}
```

**app/reel/_layout.tsx:**
```typescript
import { Stack } from 'expo-router';

export default function ReelLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    />
  );
}
```

## Todo List
- [ ] Create src/stores/reelStore.ts
- [ ] Create src/lib/sharing.ts
- [ ] Add concatenateVideos to src/lib/ffmpeg.ts
- [ ] Create src/features/reel/ClipItem.tsx
- [ ] Create src/features/reel/ClipList.tsx
- [ ] Create src/features/reel/ClipSelector.tsx
- [ ] Create src/features/reel/ReelCreatorScreen.tsx
- [ ] Create src/features/reel/ReelPreview.tsx
- [ ] Create app/reel/index.tsx
- [ ] Create app/reel/preview.tsx
- [ ] Create app/reel/_layout.tsx
- [ ] Test clip selection
- [ ] Test drag reorder
- [ ] Test concatenation
- [ ] Test share functionality
- [ ] Test save to camera roll

## Success Criteria
- [ ] Can select multiple clips from gallery
- [ ] Drag-to-reorder clips works smoothly
- [ ] FFmpeg concatenates clips correctly
- [ ] Preview plays the created reel
- [ ] Share opens native share sheet
- [ ] Save to camera roll works
- [ ] File size displayed correctly

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Concat fails mixed codecs | Medium | High | Fallback to re-encode |
| Large reel = slow export | Medium | Medium | Show progress, optimize FFmpeg |
| Drag reorder jank | Low | Medium | Use native driver animations |

## Security Considerations
- Only access user's own videos
- Camera roll permission required before saving
- Share sheet controlled by OS

## Next Steps
After completing Phase 5:
1. Proceed to [Phase 6: Gallery & Polish](./phase-06-gallery-polish.md)
2. Build full gallery with thumbnails
3. Add video deletion
4. Polish UI transitions and loading states
