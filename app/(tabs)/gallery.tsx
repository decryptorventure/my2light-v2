import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';

export default function GalleryScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View className="flex-1 bg-background px-6 justify-center items-center">
      <Text className="text-text-primary text-2xl font-bold mb-4">Gallery</Text>
      <Text className="text-text-secondary text-base mb-8">
        Video gallery will be implemented in Phase 3
      </Text>

      {user && (
        <Text className="text-text-tertiary text-sm mb-8">
          Signed in as: {user.email}
        </Text>
      )}

      <TouchableOpacity
        onPress={handleSignOut}
        className="bg-surface rounded-xl px-6 py-3"
        activeOpacity={0.7}
      >
        <Text className="text-text-primary text-base font-semibold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
