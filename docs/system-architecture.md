# System Architecture - My2Light v2

**Last Updated:** 2025-12-31
**Phase:** Phase 1 - Foundation & Setup
**Status:** Foundation Complete, Ready for Feature Implementation

## Architecture Overview

My2Light v2 is a cross-platform mobile application built on the Expo framework. It follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│         UI Layer (Expo Router + React Native)       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │  Screens     │  │  Components  │  │ Layouts  │  │
│  │              │  │ (Phase 2+)   │  │          │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│  State Management Layer (Zustand - Phase 2+)        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │Video Store   │  │ User Store   │  │ Settings │  │
│  │              │  │              │  │ Store    │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│    Business Logic Layer (Hooks & Services)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │useVideoRecording│ useAuth       │ useClipEditor  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│      Data & Services Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ Supabase API │  │ FFmpeg       │  │ Camera   │  │
│  │              │  │ Processing   │  │ Service  │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│      Storage Layer (MMKV)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ Auth Token   │  │Video Metadata│  │ Settings │  │
│  │ Cache        │  │ Cache        │  │ Local    │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Framework
- **React 19.1.0** - UI library
- **React Native 0.81.5** - Cross-platform framework
- **Expo ~54.0.30** - Development and build platform
- **Expo Router ~6.0.21** - File-based navigation

### Styling
- **TailwindCSS 3.4.19** - Utility-first CSS
- **NativeWind 4.2.1** - Tailwind for React Native
- **Dark theme** - Black background with accent colors

### State Management
- **Zustand 5.0.9** - Lightweight state management (Phase 2+)
- **React Hooks** - Local component state

### Data Persistence
- **MMKV 4.1.0** - High-performance key-value storage
- **Supabase 2.89.0** - Backend-as-a-Service

### Media Processing
- **FFmpeg Kit 6.0.2** - Video processing
- **Expo Camera ~17.0.10** - Camera access
- **Expo Media Library ~18.2.1** - Photo/video library
- **Expo AV ~16.0.8** - Audio/video playback

### Authentication
- **Expo Auth Session ~7.0.10** - OAuth flows
- **Expo Crypto ~15.0.8** - Cryptographic operations

### Development
- **TypeScript ~5.9.2** - Static typing
- **Babel** - JavaScript transpilation
- **Metro** - React Native bundler

## Core Systems

### 1. Screen/Route System (Expo Router)

File-based routing in `app/` directory:

```
app/
├── _layout.tsx        # Root layout (navigation structure)
├── index.tsx          # Home screen (/ route)
├── camera/            # Camera feature (Phase 2)
│   └── index.tsx
├── highlights/        # Highlights feature (Phase 2)
│   └── index.tsx
└── editor/            # Clip editor (Phase 3)
    └── index.tsx
```

**Current State (Phase 1):**
- Root layout with StatusBar and navigation stack
- Home screen with placeholder UI

### 2. Type System

Domain-driven type definitions in `@/types/index.ts`:

```typescript
// Core domain models
type VideoId = string;
type HighlightId = string;

interface Video {
  id: VideoId;
  uri: string;
  duration: number;
  createdAt: Date;
  highlights: Highlight[];
}

interface Highlight {
  id: HighlightId;
  videoId: VideoId;
  timestamp: number;
  duration: number;
  label?: string;
}

interface Clip {
  id: string;
  videoId: VideoId;
  startTime: number;
  endTime: number;
  speed: number;
}

interface Reel {
  id: string;
  clips: Clip[];
  musicUri?: string;
  createdAt: Date;
}
```

### 3. Storage Layer

MMKV-based persistent storage with typed getters/setters:

```typescript
// @/lib/storage.ts
- getJSON<T>(key: string): T | null
- setJSON<T>(key: string, value: T): void

StorageKeys:
- AUTH_TOKEN: 'auth_token'
- USER_ID: 'user_id'
- VIDEOS: 'videos'
- SETTINGS: 'settings'
```

**Features:**
- Automatic JSON serialization/deserialization
- Error handling with corrupted data cleanup
- Type-safe access

### 4. Design System

Centralized constants in `@/lib/constants.ts`:

**Colors:**
- Dark backgrounds: #000000, #1C1C1E, #2C2C2E
- Accent colors: Red (#FF3B30), Yellow (#FFD60A), Blue (#0A84FF)
- Semantic colors: Success, Warning, Error

**Spacing:**
- xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px

**Video Settings:**
- Default highlight duration: 5 seconds
- Clip duration range: 1-60 seconds
- Speed options: 0.5x to 2x

### 5. State Management (Phase 2+)

**Zustand Stores:**

```
src/stores/
├── useVideoStore.ts      # Video metadata & list
├── useAuthStore.ts       # Authentication state
├── useEditorStore.ts     # Clip editor state
└── useSettingsStore.ts   # User preferences
```

**Store Pattern:**
```typescript
interface Store {
  // state
  items: Item[];
  // actions
  addItem(item: Item): void;
  removeItem(id: string): void;
}
```

### 6. Component Architecture (Phase 2+)

**Functional Components:**
- React 19 with hooks
- Tailwind styling via NativeWind
- Props-driven behavior
- Memoized for performance

**Directory Structure:**
```
src/components/
├── common/              # Generic reusable components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Modal.tsx
├── video/               # Video-related components
│   ├── VideoPlayer.tsx
│   ├── VideoList.tsx
│   └── HighlightMarker.tsx
└── editor/              # Editor-specific components
    ├── TimelineEditor.tsx
    └── SpeedControl.tsx
```

### 7. Hook System (Phase 2+)

**Custom Hooks:**
```
src/hooks/
├── useVideoRecording.ts     # Camera & recording logic
├── useHighlightDetection.ts # ML-based detection
├── useClipManipulation.ts   # Trim, speed, transitions
└── useAuth.ts               # Authentication flow
```

**Hook Pattern:**
```typescript
export function useFeature() {
  const [state, setState] = useState();
  const store = useStore();

  const action = useCallback(() => {
    // logic
  }, [dependencies]);

  return { state, action };
}
```

### 8. Service Layer (Phase 2+)

**External Service Integration:**

```typescript
// src/services/supabase.ts
export const supabaseClient = createClient(url, anonKey);

// Authentication
supabaseClient.auth.signUp()
supabaseClient.auth.signIn()

// Database
supabaseClient.from('videos').select()
supabaseClient.from('reels').insert()

// Storage
supabaseClient.storage.from('videos').upload()
```

### 9. Media Processing Pipeline (Phase 2+)

```
User Records Video
       ↓
Camera Captures Frames
       ↓
FFmpeg Processes (encode, trim, effects)
       ↓
MMKV Caches Metadata
       ↓
Supabase Stores Asset
       ↓
Display in Gallery
```

**Processing Tasks:**
- Video encoding (H.264/H.265)
- Frame extraction for thumbnails
- Highlight detection (AI-based)
- Clip composition
- Speed/time manipulation
- Audio mixing

## Data Flow

### Recording Session Flow
```
Home Screen
    ↓ [Start Recording]
Camera Screen (useVideoRecording hook)
    ↓ [Capture Frames]
Video Stored (File System + MMKV Cache)
    ↓ [Process Highlights]
Highlights Detected (FFmpeg + ML)
    ↓ [Store in Supabase]
Reel Created
    ↓ [Display in Gallery]
```

### State Management Flow
```
User Action (tap button)
    ↓
Hook Dispatch (useVideoStore)
    ↓
Zustand Store Update
    ↓
Component Re-render
    ↓
MMKV Persist (if needed)
```

## Security Architecture

### Authentication
- OAuth via Expo Auth Session
- Token storage in MMKV (encrypted)
- Session management with Supabase

### Data Privacy
- User videos: Private by default
- Supabase Row-Level Security (RLS)
- Client-side encryption for sensitive data

### Permissions
- Camera: Requested at runtime
- Microphone: Requested at runtime
- Media Library: Requested at runtime
- Handled via app.json plugin config

## Performance Optimization

### Rendering
- Lazy-load route screens
- Memoize expensive components
- Virtual scrolling for video lists

### Storage
- MMKV for instant reads
- Lazy-load video metadata
- Clean up old cache entries

### Media
- Hardware-accelerated video encoding
- Progressive download for streaming
- Thumbnail generation for previews

## Scalability Considerations

### Future Extensions
- **Phase 4:** Multi-user collaboration
- **Phase 5:** Cloud sync and backup
- **Phase 6:** Advanced AI features
- **Phase 7:** Social sharing platform

### Architectural Decisions
- Modular store design (add stores as needed)
- Hook-based logic (easier testing)
- Centralized configuration (easy updates)
- Service layer (switch backends if needed)

## Deployment Architecture

### Build Platforms
- **iOS:** Apple App Store (requires Mac, provisioning)
- **Android:** Google Play Store (requires keystore)
- **Web:** Expo Web (optional)

### Build Process
```
npm run build
    ↓
EAS Build (Expo's cloud builder)
    ↓
Platform-specific artifacts
    ↓
App Store / Play Store submission
```

### Release Flow
1. Update version in package.json
2. Update CHANGELOG.md
3. Tag release in git
4. Build with EAS
5. Submit to stores
6. Monitor analytics

## Monitoring & Analytics (Phase 2+)

**Optional Services:**
- Sentry: Error tracking
- Firebase Analytics: User behavior
- Expo Updates: OTA code push

## Summary

The architecture is designed for:
- **Clarity:** Layered, modular design
- **Scalability:** Easy to add features
- **Maintainability:** Consistent patterns
- **Performance:** Optimized for mobile
- **Security:** Best practices implemented

Phase 1 establishes the foundation with proper typing, configuration, and tooling. Phase 2+ will build feature-specific systems on top of this solid base.
