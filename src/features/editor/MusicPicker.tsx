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
