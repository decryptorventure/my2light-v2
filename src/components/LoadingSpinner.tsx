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
