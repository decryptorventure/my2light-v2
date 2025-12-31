# Phase 1: Foundation & Setup

## Context
- **Plan:** [plan.md](./plan.md)
- **Next Phase:** [Phase 2: Auth & Infrastructure](./phase-02-auth-infrastructure.md)
- **Dependencies:** None (starting point)

## Overview
| Field | Value |
|-------|-------|
| Date | 2025-12-31 |
| Completed | 2025-12-31 10:17 UTC |
| Priority | P1 |
| Status | COMPLETE |
| Review Report | [Code Review](../reports/code-reviewer-251231-1001-phase1-foundation.md) |
| Effort | 4h |
| Test Results | 36/36 passed |
| Code Review | 0 critical issues |
| User Approval | Approved |

## Key Insights
- Expo SDK 54 already installed with core dependencies
- NativeWind v4 requires specific babel/metro configuration
- FFmpeg-kit needs `npx expo prebuild` (native module)
- Expo Router v4 uses file-based routing in `app/` directory

## Requirements
1. Install missing dependencies (expo-router, ffmpeg-kit)
2. Configure NativeWind v4 with Tailwind
3. Setup TypeScript path aliases
4. Create base folder structure
5. Configure app.json for plugins
6. Setup design system tokens

## Architecture Decisions

### ADR-001: File-based Routing
**Decision:** Use Expo Router v4 with `app/` directory
**Rationale:** Aligns with Next.js patterns, type-safe routing, deep linking support
**Consequences:** Must follow strict file naming conventions

### ADR-002: NativeWind v4 Configuration
**Decision:** Use NativeWind v4 with CSS variable-based theming
**Rationale:** TailwindCSS DX, consistent styling, dark mode support
**Consequences:** Requires babel plugin, metro config, global.css

### ADR-003: Project Structure
**Decision:** Feature-based organization under `src/`
**Rationale:** Scalability, clear boundaries, testability
**Structure:**
```
src/
  components/   # Shared UI components
  features/     # Feature modules (record, editor, gallery)
  hooks/        # Custom hooks
  lib/          # Utilities (supabase, ffmpeg, storage)
  stores/       # Zustand stores
  types/        # TypeScript definitions
```

## Related Code Files

### New Files to Create
```
app/
  _layout.tsx           # Root layout with providers
  index.tsx             # Entry redirect to login
  (auth)/
    login.tsx           # Login screen
  (tabs)/
    _layout.tsx         # Tab navigator
    gallery.tsx         # Gallery tab
    record.tsx          # Record tab
src/
  lib/
    supabase.ts         # Supabase client
    storage.ts          # MMKV storage wrapper
    constants.ts        # Design tokens, config
  types/
    index.ts            # Core type definitions
    video.ts            # Video-related types
    highlight.ts        # Highlight types
  components/
    ui/
      Button.tsx        # Base button component
      SafeArea.tsx      # SafeAreaView wrapper
tailwind.config.js      # Tailwind configuration
global.css              # Base styles
babel.config.js         # Babel with NativeWind
metro.config.js         # Metro bundler config
```

### Files to Modify
- `package.json` - Add expo-router, ffmpeg-kit
- `app.json` - Add expo-router scheme, camera plugin
- `tsconfig.json` - Path aliases

## Implementation Steps

### Step 1: Install Dependencies (30 min)
```bash
# Core routing
npx expo install expo-router expo-linking expo-constants expo-splash-screen

# FFmpeg (native, requires prebuild)
npm install ffmpeg-kit-react-native

# Additional utilities
npx expo install @expo/vector-icons
```

### Step 2: Configure NativeWind (45 min)

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#1C1C1E',
        'surface-elevated': '#2C2C2E',
        primary: '#FF3B30',
        secondary: '#FFD60A',
        accent: '#0A84FF',
        'text-primary': '#FFFFFF',
        'text-secondary': '#8E8E93',
        success: '#30D158',
        warning: '#FF9F0A',
        error: '#FF453A',
      },
    },
  },
  plugins: [],
};
```

**global.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**babel.config.js:**
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

**metro.config.js:**
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

### Step 3: Configure TypeScript (15 min)

**tsconfig.json:**
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

### Step 4: Update app.json (15 min)
```json
{
  "expo": {
    "name": "My2Light",
    "slug": "my2light-v2",
    "scheme": "my2light",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "backgroundColor": "#000000",
    "newArchEnabled": true,
    "plugins": [
      "expo-router",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow My2Light to access your camera for recording matches.",
          "microphonePermission": "Allow My2Light to access your microphone for audio recording.",
          "recordAudioAndroid": true
        }
      ],
      [
        "expo-media-library",
        {
          "photosPermission": "Allow My2Light to save videos to your library.",
          "savePhotosPermission": "Allow My2Light to save videos to your library.",
          "isAccessMediaLocationEnabled": true
        }
      ]
    ]
  }
}
```

### Step 5: Create Folder Structure (30 min)
```bash
mkdir -p app/(auth) app/(tabs)
mkdir -p src/{components/ui,features,hooks,lib,stores,types}
```

### Step 6: Create Base Files (90 min)

**src/types/index.ts:**
```typescript
export type VideoId = string;
export type HighlightId = string;

export interface Video {
  id: VideoId;
  uri: string;
  duration: number;
  createdAt: Date;
  thumbnailUri?: string;
  highlights: Highlight[];
}

export interface Highlight {
  id: HighlightId;
  videoId: VideoId;
  timestamp: number;
  duration: number;
  label?: string;
}

export interface Clip {
  id: string;
  videoId: VideoId;
  startTime: number;
  endTime: number;
  speed: number;
}

export interface Reel {
  id: string;
  clips: Clip[];
  musicUri?: string;
  createdAt: Date;
}
```

**src/lib/constants.ts:**
```typescript
export const COLORS = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  primary: '#FF3B30',
  secondary: '#FFD60A',
  accent: '#0A84FF',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const VIDEO = {
  defaultHighlightDuration: 5, // seconds
  maxClipDuration: 60,
  minClipDuration: 1,
  speedOptions: [0.5, 0.75, 1, 1.25, 1.5, 2],
} as const;
```

**src/lib/storage.ts:**
```typescript
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  VIDEOS: 'videos',
  SETTINGS: 'settings',
} as const;

export function getJSON<T>(key: string): T | null {
  const value = storage.getString(key);
  return value ? JSON.parse(value) : null;
}

export function setJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}
```

**app/_layout.tsx:**
```typescript
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
      />
    </>
  );
}
```

## Todo List

### Implementation (Completed)
- [x] Install expo-router and ffmpeg-kit
- [x] Create tailwind.config.js
- [x] Create global.css
- [x] Update babel.config.js for NativeWind
- [x] Create metro.config.js
- [x] Update tsconfig.json with path aliases
- [x] Update app.json with plugins
- [x] Create folder structure
- [x] Create src/types/index.ts
- [x] Create src/lib/constants.ts
- [x] Create src/lib/storage.ts
- [x] Create app/_layout.tsx
- [x] Create app/index.tsx

### Critical Fixes Required (BLOCKING)
- [x] **CRITICAL:** Fix entry point conflict - remove index.ts & App.tsx, update package.json main to "expo-router/entry"
- [x] **CRITICAL:** Add error handling to storage.ts (try-catch in getJSON/setJSON)
- [x] **CRITICAL:** Create .env.example and update .gitignore to exclude .env files
- [x] **HIGH:** Improve type safety - use ISO strings for dates, branded types for IDs
- [x] **HIGH:** Add input validation with zod schemas

### Verification (Complete)
- [x] Run `npx expo prebuild` for native modules - VERIFIED
- [x] Verify app launches with `npx expo start` - VERIFIED
- [x] Verify NativeWind styles render correctly - VERIFIED
- [x] Test TypeScript path aliases with actual imports - VERIFIED

## Success Criteria
- [x] `npx expo start` runs without errors - **VERIFIED**
- [x] NativeWind classes render correctly - **VERIFIED**
- [x] TypeScript path aliases resolve (tested successfully)
- [x] Folder structure matches architecture
- [x] FFmpeg-kit installed (native prebuild) - **VERIFIED**
- [x] All critical issues from code review resolved - **COMPLETE**

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| NativeWind config issues | Medium | High | Follow official docs, test early |
| FFmpeg prebuild failures | Low | High | Clear cache, check Xcode/Android Studio |
| Metro bundler conflicts | Low | Medium | Clear metro cache |

## Security Considerations
- No secrets in code (use env variables)
- Supabase keys will go in `.env` (Phase 2)
- Storage encryption via MMKV (default)

## Phase 1 Summary

### Completed Deliverables
1. **All dependencies installed** - expo-router, ffmpeg-kit, NativeWind v4, type definitions
2. **All configuration files created** - babel, metro, tailwind, tsconfig with path aliases
3. **Base folder structure created** - app/, src/, organized by features
4. **Type definitions implemented** - Video, Highlight, Clip, Reel types
5. **Core utilities implemented** - storage.ts, constants.ts with error handling
6. **App layout created** - Root layout with status bar, styled with NativeWind
7. **All critical issues resolved** - Entry point, error handling, env setup
8. **All tests passed** - 36/36 test suite passing
9. **Code review approved** - 0 critical issues, B+ grade
10. **User approved** - Phase 1 complete and ready for Phase 2

### Next Steps
1. Proceed to [Phase 2: Auth & Infrastructure](./phase-02-auth-infrastructure.md)
2. Setup Supabase project and environment variables
3. Implement authentication flow with Apple/Google OAuth

## Code Review Notes
**Review Date:** 2025-12-31
**Reviewer:** code-reviewer agent
**Grade:** B+ (Good with critical issues)

**Critical Issues Found:** 3
- Conflicting entry points (index.ts vs expo-router)
- Missing error handling in storage layer
- No .env configuration setup

**Full Report:** [code-reviewer-251231-1001-phase1-foundation.md](../reports/code-reviewer-251231-1001-phase1-foundation.md)
