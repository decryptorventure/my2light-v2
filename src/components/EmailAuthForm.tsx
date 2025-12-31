import { useState } from 'react';
import { View, TextInput, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { signInWithEmail, signUpWithEmail } from '@/lib/auth';

interface EmailAuthFormProps {
  onSuccess?: () => void;
}

export function EmailAuthForm({ onSuccess }: EmailAuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setIsLoading(true);

      if (isSignUp) {
        await signUpWithEmail(email, password);
        Alert.alert(
          'Success',
          'Account created! Please check your email to verify your account.',
          [{ text: 'OK', onPress: () => setIsSignUp(false) }]
        );
      } else {
        await signInWithEmail(email, password);
        onSuccess?.();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Authentication failed');
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="w-full gap-4">
      {/* Email Input */}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#8E8E93"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        className="bg-surface rounded-xl px-4 py-4 text-text-primary text-base"
      />

      {/* Password Input */}
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#8E8E93"
        secureTextEntry
        autoComplete={isSignUp ? 'password-new' : 'password'}
        className="bg-surface rounded-xl px-4 py-4 text-text-primary text-base"
      />

      {/* Submit Button */}
      <Pressable
        onPress={handleSubmit}
        disabled={isLoading}
        className="bg-primary rounded-xl px-6 py-4 items-center"
        style={{ opacity: isLoading ? 0.5 : 1 }}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text className="text-white text-base font-semibold">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Text>
        )}
      </Pressable>

      {/* Toggle Sign Up/Sign In */}
      <Pressable
        onPress={() => setIsSignUp(!isSignUp)}
        className="items-center py-2"
      >
        <Text className="text-text-secondary text-sm">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <Text className="text-primary font-semibold">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </Text>
        </Text>
      </Pressable>
    </View>
  );
}
