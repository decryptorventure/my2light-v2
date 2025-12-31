import { Modal, View, Text, Pressable } from 'react-native';
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
