import type { Video, Highlight } from '@/types';

export const mockVideo: Video = {
  id: 'test-video-1',
  uri: 'file://test-video.mp4',
  duration: 120,
  createdAt: new Date('2025-01-01'),
  highlights: [],
  thumbnailUri: 'file://test-thumb.jpg',
};

export const mockHighlight: Highlight = {
  id: 'test-highlight-1',
  videoId: 'test-video-1',
  timestamp: 30,
  duration: 5,
};

export const mockVideoWithHighlights: Video = {
  ...mockVideo,
  highlights: [mockHighlight],
};

export const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
};

export const mockSession = {
  user: mockUser,
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
};
