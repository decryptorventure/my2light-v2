# Codebase Summary - My2Light v2

**Last Updated:** 2025-12-31
**Phase:** Phase 1 - Foundation & Setup (Complete)
**Total Files:** 18 files | **Total Tokens:** 4,299

## Overview

My2Light v2 is a React Native mobile application for recording sports matches and creating highlight reels. Built with Expo, TypeScript, and NativeWind for styling. The app provides video recording, highlight extraction, and clip manipulation capabilities.

## Project Structure

```
my2light-v2/
├── app/                          # Expo Router app directory
│   ├── _layout.tsx              # Root navigation layout
│   └── index.tsx                # Home screen
├── src/
│   ├── lib/
│   │   ├── constants.ts         # Design tokens & video config
│   │   └── storage.ts           # MMKV storage wrapper
│   └── types/
│       └── index.ts             # Core type definitions
├── assets/                       # App icons and splash screens
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript configuration with path aliases
├── app.json                     # Expo configuration
├── tailwind.config.js           # Tailwind CSS theme
├── babel.config.js              # Babel with NativeWind preset
├── metro.config.js              # Metro bundler with NativeWind
├── global.css                   # Tailwind base styles
├── nativewind-env.d.ts          # NativeWind type definitions
├── .env.example                 # Environment variables template
└── .gitignore                   # Git ignore rules
```

## Key Technologies

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | React | 19.1.0 |
| **Mobile** | React Native | 0.81.5 |
| **Router** | Expo Router | ~6.0.21 |
| **Expo** | Expo SDK | ~54.0.30 |
| **Styling** | TailwindCSS + NativeWind | 3.4.19 + 4.2.1 |
| **State Management** | Zustand | 5.0.9 |
| **Storage** | MMKV | 4.1.0 |
| **Backend** | Supabase | 2.89.0 |
| **Video Processing** | FFmpeg Kit | 6.0.2 |
| **Authentication** | Expo Auth Session | ~7.0.10 |
| **Language** | TypeScript | ~5.9.2 |

## Core Data Models

### Video
```typescript
interface Video {
  id: VideoId;
  uri: string;
  duration: number;
  createdAt: Date;
  thumbnailUri?: string;
  highlights: Highlight[];
}
```

### Highlight
```typescript
interface Highlight {
  id: HighlightId;
  videoId: VideoId;
  timestamp: number;
  duration: number;
  label?: string;
}
```

### Clip
```typescript
interface Clip {
  id: string;
  videoId: VideoId;
  startTime: number;
  endTime: number;
  speed: number;
}
```

### Reel
```typescript
interface Reel {
  id: string;
  clips: Clip[];
  musicUri?: string;
  createdAt: Date;
}
```

## Design System

### Color Palette
- **Background:** #000000 (Pure Black)
- **Surface:** #1C1C1E (Dark Gray)
- **Surface Elevated:** #2C2C2E (Lighter Gray)
- **Primary:** #FF3B30 (Red)
- **Secondary:** #FFD60A (Yellow)
- **Accent:** #0A84FF (Blue)
- **Text Primary:** #FFFFFF (White)
- **Text Secondary:** #8E8E93 (Medium Gray)
- **Success:** #30D158 (Green)
- **Warning:** #FF9F0A (Orange)
- **Error:** #FF453A (Red/Error)

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

## Configuration

### TypeScript Path Aliases
```json
{
  "@/*": "./src/*",
  "@/components/*": "./src/components/*",
  "@/features/*": "./src/features/*",
  "@/hooks/*": "./src/hooks/*",
  "@/lib/*": "./src/lib/*",
  "@/stores/*": "./src/stores/*",
  "@/types/*": "./src/types/*"
}
```

### Native Permissions (Configured)
- **Camera:** For recording match videos
- **Microphone:** For audio recording during matches
- **Photo Library:** For saving processed videos

### Expo Router Configuration
- New Architecture enabled for performance
- Dark mode interface style
- Portrait orientation
- Headerless navigation (custom headers in screens)

## Storage Layer

MMKV (key-value storage) is used for persistent local storage:

**Storage Keys:**
- `auth_token` - Authentication token
- `user_id` - Current user ID
- `videos` - Cached videos metadata
- `settings` - User preferences

## Video Processing Constants

- **Default Highlight Duration:** 5 seconds
- **Max Clip Duration:** 60 seconds
- **Min Clip Duration:** 1 second
- **Speed Options:** [0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x]

## Environment Configuration

Required environment variables (see .env.example):
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_PUBLIC_SENTRY_DSN` - (Optional) Error tracking

## Dependency Highlights

### Media & Camera
- `expo-camera` - Video recording
- `expo-media-library` - Library access
- `expo-av` - Audio/Video playback
- `ffmpeg-kit-react-native` - Video processing
- `expo-file-system` - File management

### UI & Styling
- `nativewind` - Tailwind for React Native
- `@expo/vector-icons` - Icon library
- `react-native-gesture-handler` - Gesture support
- `react-native-reanimated` - Animations
- `react-native-safe-area-context` - Safe area handling

### State & Storage
- `zustand` - Lightweight state management
- `react-native-mmkv` - High-performance storage

### Backend
- `@supabase/supabase-js` - Backend services
- `expo-auth-session` - OAuth authentication
- `expo-crypto` - Cryptographic operations
- `expo-linking` - Deep linking

## Build & Development Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android emulator/device
npm run ios        # Run on iOS simulator/device
npm run web        # Run in web browser
```

## Strict TypeScript Configuration

Enabled for:
- Null/undefined checking
- No implicit any
- Strict property initialization
- Strict binding of `this`

## Metro Bundler Configuration

Integrated with NativeWind preset for Tailwind CSS support in React Native.

---

**Next Phase:** Phase 2 will introduce core features including authentication, video recording, and highlight detection.
