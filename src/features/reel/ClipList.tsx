import { View, Text, ScrollView } from 'react-native';
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

      <ScrollView showsVerticalScrollIndicator={false}>
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
      </ScrollView>

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
