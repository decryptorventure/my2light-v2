# Phase 6: Gallery & Polish

## Context
- **Plan:** [plan.md](./plan.md)
- **Previous Phase:** [Phase 5: Reel Creation](./phase-05-reel-creation.md)
- **Next Phase:** [Phase 7: Testing & QA](./phase-07-testing-qa.md)
- **Dependencies:** Phase 5 complete (reel creation, sharing)

## Overview
| Field | Value |
|-------|-------|
| Date | 2025-12-31 |
| Priority | P1 |
| Status | Pending |
| Effort | 4h |

## Key Insights
- Gallery is the main hub for viewing all videos
- Thumbnail generation improves UX significantly
- Pull-to-refresh for seamless data updates
- Haptic feedback adds premium feel
- Error boundaries prevent app crashes
- Loading states prevent UI jank

## Requirements
1. Gallery screen with video grid layout
2. Thumbnail generation and caching
3. Video preview on tap
4. Delete video functionality
5. Navigation to editor/reel creator
6. Pull-to-refresh
7. Loading and empty states
8. Error handling and recovery
9. Haptic feedback for interactions
10. Performance optimizations

## Architecture Decisions

### ADR-016: Gallery Layout
**Decision:** FlatList with 2-column grid, lazy loading
**Rationale:** Performance for large video libraries, smooth scrolling
**Consequences:** Need to manage thumbnail loading carefully

### ADR-017: Thumbnail Strategy
**Decision:** Generate and cache thumbnails on video save
**Rationale:** Faster gallery load, better UX
**Consequences:** Slower initial video processing, more storage

### ADR-018: Video Preview
**Decision:** Modal-based preview with action sheets
**Rationale:** Quick preview without navigation, familiar iOS/Android pattern
**Consequences:** Must handle video cleanup on modal close

## Related Code Files

### New Files to Create
```
src/
  features/
    gallery/
      GalleryScreen.tsx       # Main gallery screen
      VideoGrid.tsx           # Grid layout component
      VideoCard.tsx           # Single video card
      VideoPreviewModal.tsx   # Full-screen preview
      EmptyGallery.tsx        # Empty state
  hooks/
    useHaptics.ts             # Haptic feedback hook
    useThumbnails.ts          # Thumbnail management
  components/
    ErrorBoundary.tsx         # Error recovery
    LoadingSpinner.tsx        # Loading indicator
  lib/
    haptics.ts                # Haptic utilities
app/
  (tabs)/
    gallery.tsx               # Route to GalleryScreen
```

### Files to Modify
- `src/lib/videoStorage.ts` - Add thumbnail cleanup
- `src/stores/videoStore.ts` - Add refresh action
- `src/features/record/RecordScreen.tsx` - Generate thumbnail on save

## Implementation Steps

### Step 1: Thumbnail Management Hook (30 min)

**src/hooks/useThumbnails.ts:**
```typescript
import { useState, useEffect } from 'react';
import { generateThumbnail } from '@/lib/ffmpeg';
import { getThumbnailPath } from '@/lib/videoStorage';
import * as FileSystem from 'expo-file-system';
import type { VideoId } from '@/types';

interface UseThumbnailsReturn {
  thumbnailUri: string | null;
  isGenerating: boolean;
  regenerate: () => Promise<void>;
}

export function useThumbnails(
  videoId: VideoId,
  videoUri: string
): UseThumbnailsReturn {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadThumbnail();
  }, [videoId]);

  const loadThumbnail = async () => {
    const thumbPath = getThumbnailPath(videoId);
    const fileInfo = await FileSystem.getInfoAsync(thumbPath);

    if (fileInfo.exists) {
      setThumbnailUri(thumbPath);
    } else {
      await generateNewThumbnail();
    }
  };

  const generateNewThumbnail = async () => {
    setIsGenerating(true);
    try {
      const thumbPath = await generateThumbnail(videoUri, 0);
      setThumbnailUri(thumbPath);
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerate = async () => {
    await generateNewThumbnail();
  };

  return { thumbnailUri, isGenerating, regenerate };
}
```

### Step 2: Haptics Utilities (20 min)

**src/lib/haptics.ts:**
```typescript
import * as Haptics from 'expo-haptics';

export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => Haptics.selectionAsync(),
};
```

**src/hooks/useHaptics.ts:**
```typescript
import { useCallback } from 'react';
import { haptics } from '@/lib/haptics';

export function useHaptics() {
  const playSelection = useCallback(() => haptics.selection(), []);
  const playSuccess = useCallback(() => haptics.success(), []);
  const playError = useCallback(() => haptics.error(), []);
  const playLight = useCallback(() => haptics.light(), []);
  const playMedium = useCallback(() => haptics.medium(), []);

  return {
    playSelection,
    playSuccess,
    playError,
    playLight,
    playMedium,
  };
}
```

### Step 3: Error Boundary (25 min)

**src/components/ErrorBoundary.tsx:**
```typescript
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 bg-background items-center justify-center px-8">
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text className="text-text-primary text-xl font-semibold mt-4 text-center">
            Something went wrong
          </Text>
          <Text className="text-text-secondary text-center mt-2">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Pressable
            onPress={this.handleReset}
            className="bg-primary px-6 py-3 rounded-xl mt-6"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
```

### Step 4: Loading Spinner (15 min)

**src/components/LoadingSpinner.tsx:**
```typescript
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '@/lib/constants';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <>
      <ActivityIndicator size={size} color={COLORS.primary} />
      {text && (
        <Text className="text-text-secondary mt-3 text-center">{text}</Text>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        {content}
      </View>
    );
  }

  return <View className="items-center">{content}</View>;
}
```

### Step 5: Video Card Component (40 min)

**src/features/gallery/VideoCard.tsx:**
```typescript
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThumbnails } from '@/hooks/useThumbnails';
import { useHaptics } from '@/hooks/useHaptics';
import type { Video } from '@/types';
import { COLORS } from '@/lib/constants';

interface VideoCardProps {
  video: Video;
  onPress: () => void;
  onLongPress: () => void;
}

export function VideoCard({ video, onPress, onLongPress }: VideoCardProps) {
  const { thumbnailUri, isGenerating } = useThumbnails(video.id, video.uri);
  const { playLight } = useHaptics();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handlePress = () => {
    playLight();
    onPress();
  };

  const handleLongPress = () => {
    playLight();
    onLongPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      className="flex-1 aspect-[9/16] m-1 rounded-xl overflow-hidden bg-surface"
    >
      {/* Thumbnail */}
      {thumbnailUri ? (
        <Image source={{ uri: thumbnailUri }} className="w-full h-full" />
      ) : (
        <View className="w-full h-full items-center justify-center bg-surface">
          {isGenerating ? (
            <Ionicons name="hourglass" size={32} color={COLORS.textSecondary} />
          ) : (
            <Ionicons name="videocam" size={32} color={COLORS.textSecondary} />
          )}
        </View>
      )}

      {/* Gradient Overlay */}
      <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Info Overlay */}
      <View className="absolute bottom-0 left-0 right-0 p-2">
        {/* Duration */}
        <View className="bg-black/70 px-2 py-1 rounded self-start mb-1">
          <Text className="text-white text-xs font-medium">
            {formatDuration(video.duration)}
          </Text>
        </View>

        {/* Highlights Count */}
        {video.highlights.length > 0 && (
          <View className="flex-row items-center mb-1">
            <Ionicons name="star" size={12} color={COLORS.secondary} />
            <Text className="text-white text-xs ml-1">
              {video.highlights.length} highlight{video.highlights.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Date */}
        <Text className="text-white/80 text-xs">
          {formatDate(video.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}
```

### Step 6: Video Preview Modal (45 min)

**src/features/gallery/VideoPreviewModal.tsx:**
```typescript
import { Modal, View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoStore } from '@/stores/videoStore';
import { shareVideo, saveToCameraRoll } from '@/lib/sharing';
import { useHaptics } from '@/hooks/useHaptics';
import type { Video as VideoType } from '@/types';
import { COLORS } from '@/lib/constants';

interface VideoPreviewModalProps {
  visible: boolean;
  video: VideoType | null;
  onClose: () => void;
}

export function VideoPreviewModal({
  visible,
  video,
  onClose,
}: VideoPreviewModalProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { removeVideo } = useVideoStore();
  const { playSuccess, playError } = useHaptics();

  if (!video) return null;

  const handleEdit = () => {
    onClose();
    router.push(`/editor/${video.id}`);
  };

  const handleShare = async () => {
    try {
      await shareVideo(video.uri);
      playSuccess();
    } catch (error) {
      playError();
      Alert.alert('Error', 'Failed to share video');
    }
  };

  const handleSave = async () => {
    try {
      await saveToCameraRoll(video.uri);
      playSuccess();
      Alert.alert('Saved!', 'Video saved to your camera roll');
    } catch (error) {
      playError();
      Alert.alert('Error', 'Failed to save video');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Video',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeVideo(video.id);
            playSuccess();
            onClose();
          },
        },
      ]
    );
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <Pressable onPress={onClose} className="p-2">
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </Pressable>
          <Text className="text-text-primary text-lg font-semibold">Preview</Text>
          <View className="w-10" />
        </View>

        {/* Video Player */}
        <Pressable onPress={togglePlay} className="flex-1 items-center justify-center">
          <Video
            ref={videoRef}
            source={{ uri: video.uri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={true}
            onPlaybackStatusUpdate={(status) => {
              if (!status.isLoaded) return;
              setIsPlaying(status.isPlaying);
            }}
          />

          {/* Play Button Overlay */}
          {!isPlaying && (
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-20 h-20 rounded-full bg-black/50 items-center justify-center">
                <Ionicons name="play" size={40} color={COLORS.textPrimary} />
              </View>
            </View>
          )}
        </Pressable>

        {/* Actions */}
        <View className="px-4 py-6 bg-surface-elevated">
          <View className="flex-row justify-around">
            <Pressable onPress={handleEdit} className="items-center">
              <View className="w-14 h-14 rounded-full bg-surface items-center justify-center mb-2">
                <Ionicons name="create-outline" size={24} color={COLORS.textPrimary} />
              </View>
              <Text className="text-text-secondary text-xs">Edit</Text>
            </Pressable>

            <Pressable onPress={handleShare} className="items-center">
              <View className="w-14 h-14 rounded-full bg-surface items-center justify-center mb-2">
                <Ionicons name="share-outline" size={24} color={COLORS.textPrimary} />
              </View>
              <Text className="text-text-secondary text-xs">Share</Text>
            </Pressable>

            <Pressable onPress={handleSave} className="items-center">
              <View className="w-14 h-14 rounded-full bg-surface items-center justify-center mb-2">
                <Ionicons name="download-outline" size={24} color={COLORS.textPrimary} />
              </View>
              <Text className="text-text-secondary text-xs">Save</Text>
            </Pressable>

            <Pressable onPress={handleDelete} className="items-center">
              <View className="w-14 h-14 rounded-full bg-surface items-center justify-center mb-2">
                <Ionicons name="trash-outline" size={24} color={COLORS.error} />
              </View>
              <Text className="text-text-secondary text-xs">Delete</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
```

### Step 7: Empty Gallery State (20 min)

**src/features/gallery/EmptyGallery.tsx:**
```typescript
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/lib/constants';

export function EmptyGallery() {
  const handleRecord = () => {
    router.push('/(tabs)/record');
  };

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Ionicons name="videocam-outline" size={80} color={COLORS.textSecondary} />
      <Text className="text-text-primary text-2xl font-bold mt-6 text-center">
        No Videos Yet
      </Text>
      <Text className="text-text-secondary text-center mt-2">
        Start recording your pickleball highlights to see them here
      </Text>
      <Pressable
        onPress={handleRecord}
        className="bg-primary px-8 py-4 rounded-xl mt-8 flex-row items-center"
      >
        <Ionicons name="add" size={24} color="white" />
        <Text className="text-white font-semibold text-lg ml-2">
          Record Your First Video
        </Text>
      </Pressable>
    </View>
  );
}
```

### Step 8: Gallery Screen (60 min)

**src/features/gallery/GalleryScreen.tsx:**
```typescript
import { View, FlatList, RefreshControl, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoStore } from '@/stores/videoStore';
import { VideoCard } from './VideoCard';
import { VideoPreviewModal } from './VideoPreviewModal';
import { EmptyGallery } from './EmptyGallery';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Video } from '@/types';
import { COLORS } from '@/lib/constants';

export function GalleryScreen() {
  const { videos } = useVideoStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app, might refetch from Supabase
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleVideoPress = (video: Video) => {
    setSelectedVideo(video);
    setShowPreview(true);
  };

  const handleVideoLongPress = (video: Video) => {
    setSelectedVideo(video);
    setShowPreview(true);
  };

  const handleCreateReel = () => {
    router.push('/reel');
  };

  if (videos.length === 0 && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyGallery />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <Text className="text-text-primary text-2xl font-bold">Gallery</Text>
          <Pressable
            onPress={handleCreateReel}
            className="flex-row items-center bg-primary px-4 py-2 rounded-full"
          >
            <Ionicons name="film" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Create Reel</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View className="px-4 py-2">
          <Text className="text-text-secondary text-sm">
            {videos.length} video{videos.length !== 1 ? 's' : ''} •{' '}
            {videos.reduce((sum, v) => sum + v.highlights.length, 0)} highlight
            {videos.reduce((sum, v) => sum + v.highlights.length, 0) !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Video Grid */}
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <VideoCard
              video={item}
              onPress={() => handleVideoPress(item)}
              onLongPress={() => handleVideoLongPress(item)}
            />
          )}
        />

        {/* Preview Modal */}
        <VideoPreviewModal
          visible={showPreview}
          video={selectedVideo}
          onClose={() => {
            setShowPreview(false);
            setSelectedVideo(null);
          }}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
```

### Step 9: Wire Up Route (15 min)

**app/(tabs)/gallery.tsx:**
```typescript
import { GalleryScreen } from '@/features/gallery/GalleryScreen';

export default function GalleryTab() {
  return <GalleryScreen />;
}
```

### Step 10: Update Video Store (20 min)

Add refresh action to **src/stores/videoStore.ts:**
```typescript
// Add to interface
interface VideoState {
  // ... existing fields
  refreshVideos: () => Promise<void>;
}

// Add to store
export const useVideoStore = create<VideoState>()(
  persist(
    (set, get) => ({
      // ... existing state

      refreshVideos: async () => {
        // Future: Fetch from Supabase
        // For now, just trigger re-render
        set((state) => ({ videos: [...state.videos] }));
      },
    }),
    // ... persist config
  )
);
```

## Todo List
- [ ] Create src/hooks/useThumbnails.ts
- [ ] Create src/lib/haptics.ts
- [ ] Create src/hooks/useHaptics.ts
- [ ] Create src/components/ErrorBoundary.tsx
- [ ] Create src/components/LoadingSpinner.tsx
- [ ] Create src/features/gallery/VideoCard.tsx
- [ ] Create src/features/gallery/VideoPreviewModal.tsx
- [ ] Create src/features/gallery/EmptyGallery.tsx
- [ ] Create src/features/gallery/GalleryScreen.tsx
- [ ] Update app/(tabs)/gallery.tsx
- [ ] Update src/stores/videoStore.ts with refresh action
- [ ] Update RecordScreen to generate thumbnail on save
- [ ] Test gallery with multiple videos
- [ ] Test pull-to-refresh
- [ ] Test video preview and actions
- [ ] Test delete functionality

## Success Criteria
- [ ] Gallery displays videos in 2-column grid
- [ ] Thumbnails load quickly
- [ ] Pull-to-refresh works smoothly
- [ ] Video preview plays correctly
- [ ] All actions (edit, share, save, delete) work
- [ ] Empty state displays when no videos
- [ ] Haptic feedback feels premium
- [ ] Error boundary catches crashes
- [ ] Loading states prevent jank

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Thumbnail generation slow | Medium | Medium | Generate on background thread, show placeholder |
| Memory issues with many videos | Low | High | Implement pagination, lazy loading |
| Video playback fails | Low | Medium | Add error handling, fallback UI |

## Performance Optimizations
1. **Lazy thumbnail loading** - Only generate visible thumbnails
2. **FlatList optimization** - Use `getItemLayout` for consistent sizing
3. **Image caching** - Leverage Expo's built-in image caching
4. **Debounce refresh** - Prevent excessive refresh calls
5. **Memoization** - Use React.memo for VideoCard

## Accessibility Considerations
- Add proper labels for screen readers
- Ensure touch targets are at least 44x44pt
- High contrast mode support
- VoiceOver/TalkBack announcements

## Next Steps
After completing Phase 6:
1. Proceed to [Phase 7: Testing & QA](./phase-07-testing-qa.md)
2. Write unit tests for critical components
3. Perform end-to-end testing
4. Fix bugs and polish UX
