# Code Standards & Architecture - My2Light v2

**Last Updated:** 2025-12-31
**Phase:** Phase 1 - Foundation & Setup

## Project Architecture

### Directory Structure & Organization

```
src/
├── components/          # Reusable UI components (Phase 2+)
├── features/           # Feature-specific modules (Phase 2+)
├── hooks/              # Custom React hooks (Phase 2+)
├── lib/               # Utility functions and helpers
│   ├── constants.ts   # Design tokens, video config
│   └── storage.ts     # MMKV storage wrapper
├── stores/            # Zustand state management (Phase 2+)
└── types/             # TypeScript definitions
    └── index.ts       # Core domain models

app/                    # Expo Router pages
├── _layout.tsx        # Root navigation layout
└── index.tsx          # Home screen
```

## TypeScript Standards

### Strict Mode
All TypeScript files compiled with strict mode:
- `strict: true`
- No implicit `any`
- Null/undefined checks required
- Property initialization enforced

### Path Aliases
Absolute imports prevent circular dependencies:

```typescript
// Good
import { Video } from '@/types';
import { COLORS } from '@/lib/constants';
import { storage } from '@/lib/storage';

// Avoid
import { Video } from '../../../types';
```

### Type Definitions
- Define domain models in `@/types/index.ts`
- Export branded types: `type VideoId = string`
- Use interfaces for object shapes
- Use types for unions and complex compositions

```typescript
export type VideoId = string;  // Branded type
export type HighlightId = string;

export interface Video {
  id: VideoId;
  uri: string;
  duration: number;
  createdAt: Date;
  highlights: Highlight[];
}
```

## Styling Standards

### NativeWind + Tailwind CSS

All styling uses Tailwind CSS via NativeWind:

```typescript
import { View, Text } from 'react-native';

export function MyComponent() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-text-primary text-2xl font-bold mb-2">
        My2Light
      </Text>
      <Text className="text-text-secondary">Phase 1: Foundation Complete</Text>
    </View>
  );
}
```

### Color System
Use semantic color tokens instead of hex values:

```typescript
// Good
<View className="bg-background" />
<Text className="text-text-primary" />
<View className="bg-primary" />

// Avoid
<View style={{ backgroundColor: '#000000' }} />
<Text style={{ color: '#FFFFFF' }} />
```

### Spacing
Use Tailwind spacing scale:

```typescript
// Good
<View className="p-4 mb-2 mt-6" />

// Avoid
<View style={{ padding: 4, marginBottom: 2, marginTop: 6 }} />
```

## Storage Standards

### MMKV for Local Persistence
Use typed helper functions:

```typescript
import { getJSON, setJSON, StorageKeys } from '@/lib/storage';

// Store data
const user = { id: '123', name: 'John' };
setJSON(StorageKeys.USER_ID, user);

// Retrieve data
const storedUser = getJSON<typeof user>(StorageKeys.USER_ID);
```

### Storage Keys
Define all keys in `StorageKeys` enum:

```typescript
export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  VIDEOS: 'videos',
  SETTINGS: 'settings',
} as const;
```

## State Management (Phase 2+)

### Zustand Store Pattern
```typescript
import { create } from 'zustand';
import type { Video } from '@/types';

interface VideoStore {
  videos: Video[];
  addVideo: (video: Video) => void;
  removeVideo: (id: string) => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  videos: [],
  addVideo: (video) => set((state) => ({
    videos: [...state.videos, video]
  })),
  removeVideo: (id) => set((state) => ({
    videos: state.videos.filter(v => v.id !== id)
  })),
}));
```

## Component Structure (Phase 2+)

### Functional Components with Hooks
```typescript
import { View, Text } from 'react-native';
import type { Video } from '@/types';

interface VideoCardProps {
  video: Video;
  onPress?: () => void;
}

export function VideoCard({ video, onPress }: VideoCardProps) {
  return (
    <View className="bg-surface rounded-lg p-4">
      <Text className="text-text-primary font-bold">{video.id}</Text>
      <Text className="text-text-secondary text-sm">
        {Math.round(video.duration)}s
      </Text>
    </View>
  );
}
```

### Props Pattern
- Use destructuring for props
- Define `PropsWithChildren` for components accepting children
- Keep props object flat (avoid nested props objects)

```typescript
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
}
```

## Import Organization

```typescript
// 1. External libraries
import React, { useState } from 'react';
import { View, Text } from 'react-native';

// 2. Type imports
import type { Video } from '@/types';

// 3. Absolute imports from project
import { COLORS } from '@/lib/constants';
import { storage } from '@/lib/storage';

// 4. Relative imports (minimal usage)
```

## Naming Conventions

### Files
- Components: PascalCase (`VideoCard.tsx`, `HighlightList.tsx`)
- Utilities: camelCase (`formatDuration.ts`, `calculateFPS.ts`)
- Hooks: camelCase (`useVideoStorage.ts`, `useHighlightDetection.ts`)
- Types: camelCase with types folder (`types/video.ts`)

### Variables & Functions
- camelCase for variables, functions, methods
- SCREAMING_SNAKE_CASE for constants
- PascalCase for React components and types

```typescript
// Constants
export const DEFAULT_HIGHLIGHT_DURATION = 5;

// Variables
const videoList: Video[] = [];
const formattedDuration = formatDuration(video.duration);

// Functions
function calculateClipDuration(start: number, end: number): number {
  return end - start;
}

// Components
function VideoCard() { }
```

## Error Handling

### Storage Errors
MMKV wrapper handles errors gracefully:

```typescript
export function getJSON<T>(key: string): T | null {
  try {
    const value = storage.getString(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to parse JSON for key "${key}":`, error);
    storage.delete(key);  // Clean up corrupted data
    return null;
  }
}
```

### Network & Async
- Use try-catch blocks
- Handle null/undefined explicitly
- Log errors with context
- Provide fallback UI states

## Configuration Standards

### Constants Organization
All configurable values in `@/lib/constants.ts`:

```typescript
export const COLORS = { /* color palette */ };
export const SPACING = { /* spacing scale */ };
export const VIDEO = { /* video settings */ };
```

### Environment Variables
Use `EXPO_PUBLIC_` prefix for client-side variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Access in code:
```typescript
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
```

## Code Quality

### Comments
- Document `why`, not `what`
- Comment complex algorithms
- Avoid obvious comments

```typescript
// Good: explains why
// Fallback for type checking before native build
MMKV = class { /* ... */ };

// Avoid: states the obvious
// Set MMKV to a class
MMKV = class { /* ... */ };
```

### Function Length
- Keep functions under 50 lines
- Break into smaller utility functions
- Extract component parts for readability

### Avoid
- No dynamic imports without clear reason
- No `any` types (use `unknown` and narrow)
- No side effects in pure functions
- No mutable default parameters

## Testing Standards (Phase 2+)

### Unit Tests
- Test pure functions: storage, calculations
- Use Jest for unit testing
- Test error cases and edge cases

### Integration Tests
- Test component rendering with props
- Test state management flows
- Test navigation between screens

## Performance Considerations

### React Native Specifics
- Use `FlatList`/`SectionList` for large lists
- Memoize expensive components with `React.memo`
- Lazy-load screens with Expo Router
- Minimize re-renders with proper state management

### MMKV Storage
- Don't store large objects frequently
- Serialize only necessary data
- Clean up old data periodically

### FFmpeg Integration
- Run video processing off main thread
- Provide progress feedback to user
- Handle cleanup on cancellation

## Migrations & Breaking Changes

### Version Management
- Increment version in `package.json`
- Document breaking changes in release notes
- Provide migration guides for data schema changes

## Secrets & Security

### Never Commit
- `.env` files (use `.env.example` template)
- API keys or tokens
- Private certificates

### Safe Practices
- Use `EXPO_PUBLIC_` prefix for safe client variables
- Store sensitive data with backend APIs
- Use secure storage for auth tokens

---

## Phase 1 Completion Checklist

- [x] TypeScript setup with strict mode
- [x] Path aliases configured
- [x] Design system tokens defined
- [x] Storage wrapper implemented
- [x] Type definitions created
- [x] NativeWind + Tailwind integrated
- [x] Metro bundler configured
- [x] Root layout and home screen created
- [x] Environment variables template

## Next Steps (Phase 2+)

- [ ] Create reusable UI components
- [ ] Set up Zustand stores
- [ ] Implement camera integration
- [ ] Build authentication flow
- [ ] Create highlight detection
- [ ] Add video editing features
