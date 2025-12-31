import { useState } from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, Alert } from 'react-native';
import { signInWithOAuth } from '@/lib/auth';

type OAuthProvider = 'apple' | 'google';

interface OAuthButtonProps {
  provider: OAuthProvider;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const PROVIDER_CONFIG = {
  apple: {
    label: 'Continue with Apple',
    icon: '🍎',
    bgColor: 'bg-white',
    textColor: 'text-black',
  },
  google: {
    label: 'Continue with Google',
    icon: '🔵',
    bgColor: 'bg-white',
    textColor: 'text-black',
  },
} as const;

export function OAuthButton({ provider, onSuccess, onError }: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const config = PROVIDER_CONFIG[provider];

  const handlePress = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithOAuth(provider);

      if (result) {
        onSuccess?.();
      } else {
        throw new Error('Authentication cancelled or failed');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Authentication failed');
      console.error(`OAuth ${provider} error:`, err);

      Alert.alert(
        'Sign In Failed',
        err.message || 'Please try again later',
        [{ text: 'OK' }]
      );

      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLoading}
      className={`${config.bgColor} rounded-xl px-6 py-4 flex-row items-center justify-center ${
        isLoading ? 'opacity-50' : ''
      }`}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color="#000" />
      ) : (
        <>
          <Text className="text-2xl mr-3">{config.icon}</Text>
          <Text className={`${config.textColor} text-base font-semibold`}>
            {config.label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
