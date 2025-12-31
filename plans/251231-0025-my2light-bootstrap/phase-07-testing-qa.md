# Phase 7: Testing & Quality Assurance

## Context
- **Plan:** [plan.md](./plan.md)
- **Previous Phase:** [Phase 6: Gallery & Polish](./phase-06-gallery-polish.md)
- **Next Phase:** None (final phase)
- **Dependencies:** Phases 1-6 complete (all features implemented)

## Overview
| Field | Value |
|-------|-------|
| Date | 2025-12-31 |
| Priority | P1 |
| Status | Pending |
| Effort | 2h |

## Key Insights
- Testing catches bugs before users do
- Jest + React Native Testing Library for unit/integration tests
- Manual testing on real devices is critical
- Performance testing prevents production issues
- Error tracking helps post-launch debugging

## Requirements
1. Unit tests for core utilities
2. Integration tests for critical flows
3. Manual testing checklist
4. Performance benchmarks
5. Error tracking setup
6. Build validation
7. Pre-launch checklist

## Architecture Decisions

### ADR-019: Testing Strategy
**Decision:** Jest for unit/integration, manual for E2E
**Rationale:** E2E tools (Detox, Appium) add complexity, manual testing faster for MVP
**Consequences:** Must maintain testing discipline manually

### ADR-020: Error Tracking
**Decision:** Sentry for production error monitoring
**Rationale:** Industry standard, React Native support, good free tier
**Consequences:** Need to configure sourcemaps for useful stack traces

### ADR-021: Performance Monitoring
**Decision:** React Native Performance monitoring + manual profiling
**Rationale:** Built-in tools sufficient for MVP, upgrade later if needed
**Consequences:** Must establish performance baselines

## Related Code Files

### New Files to Create
```
__tests__/
  lib/
    videoStorage.test.ts      # Video storage utilities
    ffmpeg.test.ts            # FFmpeg commands
    auth.test.ts              # Auth helpers
  stores/
    videoStore.test.ts        # Video store logic
    authStore.test.ts         # Auth store logic
  hooks/
    useRecording.test.ts      # Recording hook
test-utils/
  setup.ts                    # Jest setup
  test-helpers.ts             # Common test utilities
  mocks.ts                    # Mock data
.eslintrc.js                  # ESLint config
jest.config.js                # Jest configuration
```

### Files to Modify
- `package.json` - Add test scripts and dependencies
- `tsconfig.json` - Add test paths

## Implementation Steps

### Step 1: Install Testing Dependencies (15 min)

```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
npm install --save-dev @types/jest ts-jest
npm install --save-dev @react-native/eslint-config eslint-plugin-prettier
```

### Step 2: Jest Configuration (20 min)

**jest.config.js:**
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/test-utils/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/types/**',
  ],
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

**test-utils/setup.ts:**
```typescript
import '@testing-library/jest-native/extend-expect';

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

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
```

### Step 3: Test Utilities (15 min)

**test-utils/test-helpers.ts:**
```typescript
import { render, RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';

// Custom render with providers if needed
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions
) {
  return render(ui, { ...options });
}

// Wait for async operations
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Common assertions
export const expectToBeVisible = (element: any) => {
  expect(element).toBeTruthy();
  expect(element.props.style).not.toContain({ display: 'none' });
};
```

**test-utils/mocks.ts:**
```typescript
import type { Video, Highlight } from '@/types';

export const mockVideo: Video = {
  id: 'test-video-1',
  uri: 'file://test-video.mp4',
  duration: 120,
  createdAt: new Date('2025-01-01'),
  highlights: [],
};

export const mockHighlight: Highlight = {
  id: 'test-highlight-1',
  videoId: 'test-video-1',
  timestamp: 30,
  duration: 5,
  label: 'Great shot',
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
```

### Step 4: Unit Tests (40 min)

**__tests__/lib/videoStorage.test.ts:**
```typescript
import * as FileSystem from 'expo-file-system';
import {
  generateVideoId,
  getVideoPath,
  createVideoMetadata,
} from '@/lib/videoStorage';
import { mockVideo } from '../../test-utils/mocks';

describe('videoStorage', () => {
  describe('generateVideoId', () => {
    it('should generate unique video IDs', () => {
      const id1 = generateVideoId();
      const id2 = generateVideoId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^vid_\d+_[a-z0-9]+$/);
    });
  });

  describe('getVideoPath', () => {
    it('should return correct path for video ID', () => {
      const path = getVideoPath('test-id');
      expect(path).toContain('videos/test-id.mp4');
    });
  });

  describe('createVideoMetadata', () => {
    it('should create video metadata with highlights', () => {
      const metadata = createVideoMetadata(
        'test-id',
        'file://test.mp4',
        120,
        [{ timestamp: 30 }, { timestamp: 60 }]
      );

      expect(metadata.id).toBe('test-id');
      expect(metadata.duration).toBe(120);
      expect(metadata.highlights).toHaveLength(2);
      expect(metadata.highlights[0].timestamp).toBe(30);
    });
  });
});
```

**__tests__/stores/videoStore.test.ts:**
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useVideoStore } from '@/stores/videoStore';
import { mockVideo, mockHighlight } from '../../test-utils/mocks';

describe('videoStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useVideoStore.setState({ videos: [], currentRecording: {
      isRecording: false,
      startTime: null,
      highlights: [],
    }});
  });

  it('should add video to store', () => {
    const { result } = renderHook(() => useVideoStore());

    act(() => {
      result.current.addVideo(mockVideo);
    });

    expect(result.current.videos).toHaveLength(1);
    expect(result.current.videos[0].id).toBe(mockVideo.id);
  });

  it('should remove video from store', () => {
    const { result } = renderHook(() => useVideoStore());

    act(() => {
      result.current.addVideo(mockVideo);
      result.current.removeVideo(mockVideo.id);
    });

    expect(result.current.videos).toHaveLength(0);
  });

  it('should start and stop recording', () => {
    const { result } = renderHook(() => useVideoStore());

    act(() => {
      result.current.startRecording();
    });

    expect(result.current.currentRecording.isRecording).toBe(true);
    expect(result.current.currentRecording.startTime).toBeTruthy();

    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.currentRecording.isRecording).toBe(false);
  });

  it('should tag highlights during recording', () => {
    const { result } = renderHook(() => useVideoStore());

    act(() => {
      result.current.startRecording();
    });

    act(() => {
      result.current.tagHighlight();
      result.current.tagHighlight();
    });

    expect(result.current.currentRecording.highlights).toHaveLength(2);
  });
});
```

### Step 5: Update Package.json (10 min)

Add to **package.json:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

### Step 6: Manual Testing Checklist (20 min)

Create **TESTING_CHECKLIST.md:**
```markdown
# Manual Testing Checklist

## Authentication
- [ ] Login with Apple works
- [ ] Login with Google works
- [ ] Session persists after app restart
- [ ] Sign out clears session and redirects to login

## Recording
- [ ] Camera permissions requested correctly
- [ ] Camera preview displays
- [ ] Recording starts and stops
- [ ] Highlight tagging works during recording
- [ ] Timer displays correctly
- [ ] Video saves to local storage
- [ ] Flip camera works

## Video Editing
- [ ] Video loads in editor
- [ ] Playback controls work (play/pause/seek)
- [ ] Timeline trim handles respond to gestures
- [ ] Speed control changes playback speed
- [ ] Music overlay adds background audio
- [ ] Export processes video correctly
- [ ] Progress indicator shows during processing

## Reel Creation
- [ ] Clip selection from gallery works
- [ ] Drag-to-reorder clips functions
- [ ] Concatenation produces valid output
- [ ] Preview plays concatenated reel
- [ ] Share menu opens
- [ ] Save to camera roll works

## Gallery
- [ ] Videos display in grid
- [ ] Thumbnails load correctly
- [ ] Pull-to-refresh updates list
- [ ] Video preview modal opens
- [ ] Delete removes video and thumbnail
- [ ] Empty state displays when no videos

## Performance
- [ ] App launches in < 3 seconds
- [ ] Gallery scrolling is smooth (60fps)
- [ ] Camera preview has no lag
- [ ] Recording doesn't drop frames
- [ ] Video playback is smooth
- [ ] No memory leaks (test with multiple videos)

## Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Permission denials handled gracefully
- [ ] FFmpeg failures don't crash app
- [ ] Invalid video files handled
- [ ] Error boundary catches React errors

## Device Testing
- [ ] iPhone 12 Pro (iOS 16)
- [ ] iPhone 14 (iOS 17)
- [ ] Pixel 6 (Android 13)
- [ ] Samsung Galaxy S22 (Android 14)
```

### Step 7: Performance Benchmarks (15 min)

Create **PERFORMANCE.md:**
```markdown
# Performance Benchmarks

## Metrics to Track

### App Launch
- **Target:** < 3 seconds to interactive
- **Measurement:** Time from tap to gallery visible

### Recording
- **Target:** 60fps camera preview
- **Measurement:** Use React DevTools Profiler
- **Max memory:** < 200MB during recording

### Video Processing
- **Trim 1-min video:** < 5 seconds
- **Speed change 1-min video:** < 15 seconds
- **Concat 3x 30-sec videos:** < 10 seconds

### Gallery
- **Scroll performance:** 60fps
- **Thumbnail load:** < 500ms per thumbnail
- **Memory per video:** < 5MB

## Optimization Tips
1. Use FlatList with `getItemLayout` for known heights
2. Memoize VideoCard components
3. Lazy load thumbnails
4. Use FFmpeg `-c copy` when possible
5. Implement video pagination for 50+ videos
```

### Step 8: Error Tracking Setup (15 min)

Install Sentry:
```bash
npm install --save @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

**Add to app/_layout.tsx:**
```typescript
import * as Sentry from '@sentry/react-native';

// Initialize Sentry
if (!__DEV__) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enableInExpoDevelopment: false,
    debug: false,
  });
}
```

### Step 9: Pre-Launch Checklist (10 min)

Create **PRE_LAUNCH.md:**
```markdown
# Pre-Launch Checklist

## Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint passes with no warnings
- [ ] Test coverage > 60%
- [ ] No console.log statements in production code
- [ ] All TODOs addressed or documented

## Build Validation
- [ ] iOS build succeeds
- [ ] Android build succeeds
- [ ] No build warnings
- [ ] App size < 50MB (before assets)

## Configuration
- [ ] Environment variables set correctly
- [ ] Supabase OAuth configured
- [ ] Apple Sign In enabled
- [ ] Google Sign In enabled
- [ ] Sentry DSN configured

## Assets
- [ ] App icon set (1024x1024)
- [ ] Splash screen configured
- [ ] App name finalized
- [ ] Version number set (1.0.0)

## Privacy & Legal
- [ ] Privacy policy URL added
- [ ] Terms of service URL added
- [ ] Camera permission text set
- [ ] Microphone permission text set
- [ ] Photo library permission text set

## App Store Preparation
- [ ] Screenshots prepared (iOS 6.5", 5.5")
- [ ] App description written
- [ ] Keywords selected
- [ ] App category chosen
- [ ] Support URL added
- [ ] Marketing URL added (optional)

## Final Testing
- [ ] Clean install test on iOS
- [ ] Clean install test on Android
- [ ] Works without internet after login
- [ ] Background app handling tested
- [ ] Push notifications (if added)
```

## Todo List
- [ ] Install testing dependencies
- [ ] Create jest.config.js
- [ ] Create test-utils/setup.ts
- [ ] Create test-utils/test-helpers.ts
- [ ] Create test-utils/mocks.ts
- [ ] Write unit tests for videoStorage
- [ ] Write unit tests for videoStore
- [ ] Write tests for other critical modules
- [ ] Create TESTING_CHECKLIST.md
- [ ] Create PERFORMANCE.md
- [ ] Create PRE_LAUNCH.md
- [ ] Install and configure Sentry
- [ ] Run all tests and achieve >60% coverage
- [ ] Complete manual testing checklist
- [ ] Fix all discovered bugs
- [ ] Validate performance benchmarks

## Success Criteria
- [ ] Test coverage > 60%
- [ ] All critical flows have tests
- [ ] Manual testing checklist 100% complete
- [ ] No known critical bugs
- [ ] Performance benchmarks met
- [ ] Error tracking configured
- [ ] Pre-launch checklist complete

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tests don't catch regression bugs | Medium | High | Combine unit + manual testing |
| Performance degrades on older devices | Medium | Medium | Test on range of devices, optimize |
| Production errors not tracked | Low | High | Sentry configured before launch |

## Testing Best Practices
1. **Test behavior, not implementation** - Focus on user outcomes
2. **Keep tests fast** - Mock expensive operations
3. **Test edge cases** - Empty states, errors, boundaries
4. **Maintain test data** - Use factories for consistent test data
5. **Run tests in CI** - Automate testing on every commit

## CI/CD Recommendations
While not implemented in this phase, consider:
- **GitHub Actions** - Run tests on every PR
- **EAS Build** - Automated builds for iOS/Android
- **EAS Update** - OTA updates for bug fixes
- **Preview builds** - Share builds with testers

## Next Steps
After completing Phase 7:
1. Address any bugs found during testing
2. Optimize performance bottlenecks
3. Prepare app store submissions
4. Plan post-launch monitoring strategy
5. **Ship to production! 🚀**
