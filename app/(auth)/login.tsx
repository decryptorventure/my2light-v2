import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { EmailAuthForm } from '@/components/EmailAuthForm';

export default function LoginScreen() {
  const router = useRouter();

  const handleSignInSuccess = () => {
    // Navigate to tabs on successful sign-in
    router.replace('/(tabs)/gallery');
  };

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      {/* App Logo/Title */}
      <View className="items-center mb-16">
        <Text className="text-primary text-6xl font-bold mb-4">My2Light</Text>
        <Text className="text-text-secondary text-base text-center">
          Capture, highlight, and share your best moments
        </Text>
      </View>

      {/* Email/Password Form */}
      <EmailAuthForm onSuccess={handleSignInSuccess} />

      {/* Terms */}
      <Text className="text-text-tertiary text-xs text-center mt-8">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}
