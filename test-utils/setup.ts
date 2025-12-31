// Mock expo modules
jest.mock('expo-camera', () => ({
  Camera: {
    getCameraPermissionsAsync: jest.fn(),
    requestCameraPermissionsAsync: jest.fn(),
    getMicrophonePermissionsAsync: jest.fn(),
    requestMicrophonePermissionsAsync: jest.fn(),
  },
  CameraView: 'CameraView',
}));

jest.mock('expo-av', () => ({
  Video: 'Video',
  ResizeMode: { CONTAIN: 'contain' },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://mock/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  moveAsync: jest.fn(),
  deleteAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('ffmpeg-kit-react-native', () => ({
  FFmpegKit: {
    execute: jest.fn(),
    cancel: jest.fn(),
  },
  FFmpegKitConfig: {
    enableStatisticsCallback: jest.fn(),
  },
  ReturnCode: {
    isSuccess: jest.fn(() => true),
  },
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
