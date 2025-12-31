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
