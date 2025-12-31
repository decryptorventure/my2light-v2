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
