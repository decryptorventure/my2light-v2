---
title: "My2Light v2 - Pickleball Highlight Recorder"
description: "Mobile app for recording, editing, and sharing pickleball match highlights"
status: in-progress
priority: P1
effort: 40h
branch: master
tags: [expo, react-native, video-editing, ffmpeg, supabase]
created: 2025-12-31
---

# My2Light v2 Implementation Plan

## Vision
Minimal mobile app for recording pickleball matches, tagging highlights, editing clips, creating reels, and sharing to social media.

## Tech Stack (Locked)
- **Framework:** Expo SDK 54 + TypeScript + Expo Router v4
- **Styling:** NativeWind v4 (TailwindCSS)
- **State:** Zustand v4 + react-native-mmkv
- **Video:** expo-camera, expo-av, ffmpeg-kit-react-native
- **Backend:** Supabase (Auth, DB, Storage)

## Target Screens
1. **Login** - Apple/Google OAuth
2. **Gallery** - Video list with thumbnails
3. **Record** - Camera with highlight tagging
4. **Editor** - Trim, speed, music overlay
5. **Reel Creator** - Concatenate clips

## Design System
- Dark theme: Background `#000000`, Surface `#1C1C1E`
- Primary `#FF3B30` (red), Secondary `#FFD60A` (gold), Accent `#0A84FF` (blue)
- 4px grid spacing, System fonts

## Phase Overview

| Phase | Name | Effort | Focus |
|-------|------|--------|-------|
| 1 | [Foundation & Setup](./phase-01-foundation-setup.md) | 4h | Dependencies, config, types |
| 2 | [Auth & Infrastructure](./phase-02-auth-infrastructure.md) | 6h | Supabase, auth flow, stores |
| 3 | [Recording & Camera](./phase-03-recording-camera.md) | 8h | Camera, permissions, tagging |
| 4 | [Video Editing](./phase-04-video-editing.md) | 10h | FFmpeg, trim, speed, music |
| 5 | [Reel Creation](./phase-05-reel-creation.md) | 6h | Concat clips, export |
| 6 | [Gallery & Polish](./phase-06-gallery-polish.md) | 4h | UI refinement, thumbnails |
| 7 | [Testing & QA](./phase-07-testing-qa.md) | 2h | Jest, integration tests |

## Implementation Order
1. Project setup + NativeWind config
2. Supabase client + Auth flow
3. Camera permissions + Recording with tagging
4. Local video storage + Player component
5. Timeline UI + Trim slider (FFmpeg)
6. Speed control + Music overlay
7. Reel creator (concat)
8. Gallery screen + Share functionality
9. Polish + Error handling

## Success Criteria
- [ ] Record video with tap-to-tag highlights
- [ ] Edit clips: trim, speed adjustment, music overlay
- [ ] Create reels from multiple clips
- [ ] Share to device/social media
- [ ] Apple + Google OAuth working
- [ ] Smooth 60fps UI performance

## Risks
- **FFmpeg performance:** Complex commands may be slow on older devices
- **File storage:** Large videos require careful memory management
- **OAuth setup:** Apple/Google developer console configuration required

## Quick Start
```bash
npm install
npx expo prebuild  # For native FFmpeg
npx expo run:ios   # Or run:android
```
