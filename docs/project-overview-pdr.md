# Project Overview & Product Development Requirements

**Project Name:** My2Light v2
**Last Updated:** 2025-12-31
**Current Phase:** 1 (Foundation & Setup)
**Status:** Complete
**Version:** 1.0.0

---

## Executive Summary

My2Light is a mobile application designed to help sports enthusiasts record matches and create professional highlight reels with ease. The app provides intuitive video recording, intelligent highlight extraction, and powerful clip editing capabilities with music synchronization.

**Target Users:** Sports enthusiasts, coaches, scouts, highlight creators
**Platform:** iOS, Android (React Native via Expo)
**Key Feature:** One-tap highlight extraction and reel generation

---

## Project Vision

Democratize highlight reel creation for sports by providing an affordable, user-friendly mobile tool that uses AI-powered highlight detection to save time and produce professional-quality content.

---

## Phase Breakdown

### Phase 1: Foundation & Setup (COMPLETE)
- [x] Expo project setup with TypeScript
- [x] Navigation structure (Expo Router)
- [x] Styling system (TailwindCSS + NativeWind)
- [x] Storage layer (MMKV wrapper)
- [x] Type definitions for core models
- [x] Design system tokens
- [x] Environment configuration
- [x] Home screen placeholder

**Deliverables:**
- Fully configured development environment
- Type-safe codebase foundation
- Centralized design token system
- Storage abstraction layer

### Phase 2: Core Features & Authentication
**Timeline:** Week 2-3

**Requirements:**
1. User Authentication
   - Email/password signup and login
   - OAuth integration (Google, Apple)
   - Session management with token refresh
   - Password reset flow

2. Video Recording Interface
   - Camera screen with live preview
   - Record/pause/stop controls
   - Flash/camera toggle
   - Real-time duration display
   - Microphone access for audio recording

3. Video Gallery
   - Browse recorded videos
   - Thumbnail generation
   - Video duration display
   - Delete video functionality
   - Sort by date/duration

4. State Management
   - Zustand stores for user, video, and settings
   - Persistent store hydration from MMKV
   - Action logging for debugging

### Phase 3: Highlight Detection & Editing
**Timeline:** Week 4-5

**Requirements:**
1. Highlight Detection
   - Manual highlight marking (tap to mark)
   - Multiple highlight marks per video
   - Highlight duration configuration (1-30s)
   - Preview highlights before creation

2. Basic Clip Editor
   - Trim clip start/end times
   - Speed adjustment (0.5x - 2x)
   - Simple transitions between clips
   - Preview edited clips

3. Reel Composition
   - Combine multiple clips into reel
   - Reorder clips in timeline
   - Adjust timing and gaps between clips

### Phase 4: Advanced Editing & Media
**Timeline:** Week 6-7

**Requirements:**
1. Music Integration
   - Browse music library
   - Add background music to reels
   - Audio mixing (video + music)
   - Volume controls for each audio track

2. Visual Effects
   - Basic filters (brightness, contrast, saturation)
   - Text overlays with customizable fonts
   - Caption/watermark support
   - Frame rate/quality settings

3. Export & Sharing
   - Export reel as MP4
   - Share to social media (Instagram, TikTok, YouTube)
   - Share via messaging apps
   - Cloud storage integration

### Phase 5: Cloud Sync & Backup
**Timeline:** Week 8-9

**Requirements:**
1. Cloud Storage
   - Automatic backup to Supabase
   - Resume interrupted uploads
   - Bandwidth-aware uploads
   - Offline-first architecture

2. User Profiles
   - View profile information
   - Settings/preferences page
   - Storage quota management
   - Privacy settings

3. Reel Management
   - Browse created reels
   - Publish reels as public/private
   - Share reel links
   - Analytics (views, shares)

### Phase 6: Advanced AI & Social
**Timeline:** Week 10-12

**Requirements:**
1. Intelligent Highlight Detection
   - ML model for automatic highlight detection
   - Sports-specific detection (goals, fouls, etc.)
   - Crowd reaction analysis
   - Moment importance scoring

2. Social Features
   - User accounts with profiles
   - Follow other creators
   - Like/comment on reels
   - Trending reels feed

3. Community
   - Featured reels section
   - Leaderboards (by sport)
   - User discovery
   - In-app messaging

---

## Functional Requirements

### Core Functionality

#### 1. Video Recording
- **FR-1.1:** User can open camera with single tap from home screen
- **FR-1.2:** Camera preview shows live video feed
- **FR-1.3:** Record button starts/pauses recording
- **FR-1.4:** Stop button ends recording and saves video
- **FR-1.5:** User can switch between front/back cameras
- **FR-1.6:** Flash light can be toggled on/off
- **FR-1.7:** Real-time duration counter shows elapsed time
- **FR-1.8:** Microphone captures audio during recording

#### 2. Highlight Marking
- **FR-2.1:** User can mark highlight start point in video
- **FR-2.2:** User can mark highlight end point (duration configurable)
- **FR-2.3:** Multiple highlights can be marked in single video
- **FR-2.4:** Marked highlights are previewed before creation
- **FR-2.5:** User can delete individual highlights

#### 3. Clip Editing
- **FR-3.1:** User can trim clip to exact start/end frames
- **FR-3.2:** Playback speed can be adjusted (0.5x - 2x in 0.25x increments)
- **FR-3.3:** Clips can be reordered in timeline
- **FR-3.4:** Transition effects can be added between clips
- **FR-3.5:** Audio from video can be muted/adjusted

#### 4. Reel Creation
- **FR-4.1:** Multiple clips can be combined into single reel
- **FR-4.2:** Reels are saved with metadata (created date, duration)
- **FR-4.3:** Reel preview shows all clips in sequence
- **FR-4.4:** Reels can be exported as MP4 file

#### 5. Music Integration
- **FR-5.1:** User can select music from library
- **FR-5.2:** Music can be synced to reel duration
- **FR-5.3:** Audio mixing adjusts video and music levels
- **FR-5.4:** Fade in/out effects on music track

#### 6. User Management
- **FR-6.1:** User can create account with email
- **FR-6.2:** User can sign in with OAuth (Google, Apple)
- **FR-6.3:** User sessions persist across app restarts
- **FR-6.4:** User can view profile information
- **FR-6.5:** User can log out and clear session

#### 7. Storage & Backup
- **FR-7.1:** Videos are stored locally in device file system
- **FR-7.2:** Video metadata cached in MMKV
- **FR-7.3:** Reels backed up to Supabase
- **FR-7.4:** User data encrypted in transit (HTTPS)

---

## Non-Functional Requirements

### Performance
- **NFR-1.1:** Camera preview renders at 30+ FPS
- **NFR-1.2:** Video recording continues without drops in quality
- **NFR-1.3:** Clip preview loads within 2 seconds
- **NFR-1.4:** Reel export completes in reasonable time (depends on duration)
- **NFR-1.5:** App startup time < 3 seconds

### Reliability
- **NFR-2.1:** App does not crash during video recording
- **NFR-2.2:** Interrupted recording can be resumed
- **NFR-2.3:** Failed uploads are retried automatically
- **NFR-2.4:** Corrupted data is detected and cleaned up
- **NFR-2.5:** App handles network loss gracefully

### Security
- **NFR-3.1:** Auth tokens stored securely (encrypted)
- **NFR-3.2:** User videos are private by default
- **NFR-3.3:** Supabase RLS policies enforce authorization
- **NFR-3.4:** User can control data visibility settings
- **NFR-3.5:** No passwords stored in logs

### Usability
- **NFR-4.1:** Onboarding completed within 2 minutes
- **NFR-4.2:** Core recording flow requires < 3 taps
- **NFR-4.3:** All UI text is clear and unambiguous
- **NFR-4.4:** App supports dark mode (default)
- **NFR-4.5:** Accessibility features: text scaling, high contrast mode

### Compatibility
- **NFR-5.1:** Supports iOS 13+ and Android 8+
- **NFR-5.2:** Works with all modern iPhone/Android models
- **NFR-5.3:** Handles different screen sizes (phones and tablets)
- **NFR-5.4:** Works on both WiFi and cellular connections
- **NFR-5.5:** Handles low storage gracefully

### Maintainability
- **NFR-6.1:** Code coverage > 80%
- **NFR-6.2:** Codebase follows TypeScript strict mode
- **NFR-6.3:** Components are reusable and composable
- **NFR-6.4:** API changes documented with migration guides

---

## Technical Architecture Decisions

### Technology Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | React Native + Expo | Fast development, single codebase for iOS/Android |
| **Styling** | TailwindCSS + NativeWind | Utility-first, maintainable, consistent design |
| **State Management** | Zustand | Lightweight, minimal boilerplate, great DX |
| **Storage** | MMKV | 10x faster than AsyncStorage, Supabase for cloud |
| **Video Processing** | FFmpeg Kit | Industry standard, good React Native support |
| **Backend** | Supabase | Open source, PostgreSQL, built-in auth & storage |
| **Language** | TypeScript | Type safety, better IDE support, fewer bugs |

### Architectural Patterns

1. **Layered Architecture**
   - UI Layer: React components and screens
   - State Layer: Zustand stores
   - Business Logic: Custom hooks
   - Service Layer: API clients, FFmpeg, camera
   - Storage Layer: MMKV and Supabase

2. **Component Composition**
   - Functional components with hooks
   - Props-driven behavior
   - Memoization for performance

3. **State Management**
   - Centralized Zustand stores
   - Local component state for UI-only values
   - Persistent hydration from MMKV

4. **Error Handling**
   - Try-catch blocks for async operations
   - Graceful fallbacks for failed operations
   - Error logging to Sentry (optional)

---

## Acceptance Criteria

### Phase 1 (Completed)
- [ ] App starts without errors
- [ ] TypeScript compilation succeeds
- [ ] All path aliases work correctly
- [ ] Design tokens accessible throughout codebase
- [ ] Storage wrapper handles errors gracefully
- [ ] Home screen renders correctly
- [ ] Navigation structure established

### Phase 2
- [ ] User can sign up with email
- [ ] User can sign in with email or OAuth
- [ ] Camera screen opens and shows live preview
- [ ] Video records to device storage
- [ ] Recorded videos appear in gallery
- [ ] Video list shows thumbnails and duration

### Phase 3
- [ ] User can mark highlights in video
- [ ] Multiple highlights can be marked
- [ ] Clip editor trims videos accurately
- [ ] Speed adjustment works for multiple speeds
- [ ] Clips combine into reel without errors

### Phase 4
- [ ] Music can be added to reel
- [ ] Audio mixing balances video and music
- [ ] Reel exports as playable MP4
- [ ] Exported video has good quality
- [ ] Reel can be shared to social media

### Phase 5
- [ ] Reels automatically backup to cloud
- [ ] User profile is editable
- [ ] Cloud storage quota is visible
- [ ] Offline recording works
- [ ] Sync resumes after network reconnect

---

## Success Metrics

### User Engagement
- **Target:** 80% of users complete first highlight reel within 24 hours
- **Measurement:** Track user journey in analytics

### Performance
- **Target:** <100ms camera latency for live preview
- **Measurement:** Monitor frame timing and fps

### Reliability
- **Target:** 99.9% uptime for API endpoints
- **Measurement:** CloudFlare/Sentry monitoring

### Adoption
- **Target:** 10k downloads in first month
- **Measurement:** App Store analytics

### Retention
- **Target:** 30-day retention rate > 25%
- **Measurement:** Compare cohorts monthly

---

## Risk Assessment

### High Risk
1. **Video Processing Complexity**
   - Risk: FFmpeg integration may have platform-specific issues
   - Mitigation: Extensive testing on iOS/Android, use EAS Build

2. **Performance on Low-End Devices**
   - Risk: Video processing may lag on older phones
   - Mitigation: Quality settings, progressive encoding, optimize FFmpeg

3. **Storage Quota**
   - Risk: Users may exceed device storage
   - Mitigation: Warn before recording, implement cleanup UI

### Medium Risk
1. **Backend Scalability**
   - Risk: Supabase may struggle with viral growth
   - Mitigation: Horizontal scaling plan, CDN for video delivery

2. **Competitor Features**
   - Risk: Similar apps may add better features
   - Mitigation: Focus on UX, gather user feedback frequently

3. **Platform API Changes**
   - Risk: iOS/Android camera APIs may change
   - Mitigation: Stay updated with Expo releases, test regularly

### Low Risk
1. **Regulatory Compliance**
   - Risk: Sports footage copyright concerns
   - Mitigation: User agreements, DMCA policy

2. **Team Skills**
   - Risk: Team unfamiliar with React Native
   - Mitigation: Documentation, internal training, external resources

---

## Timeline & Milestones

| Phase | Duration | Key Milestone | Target Date |
|-------|----------|--------------|------------|
| Phase 1 | 1 week | Foundation complete, dev ready | Dec 31, 2025 |
| Phase 2 | 2 weeks | Auth + recording working | Jan 14, 2026 |
| Phase 3 | 2 weeks | Editing + highlights complete | Jan 28, 2026 |
| Phase 4 | 2 weeks | Music + export working | Feb 11, 2026 |
| Phase 5 | 2 weeks | Cloud sync complete | Feb 25, 2026 |
| Phase 6 | 3 weeks | AI features + social | Mar 18, 2026 |
| **Total** | **12 weeks** | **MVP to app stores** | **Mar 18, 2026** |

---

## Resource Requirements

### Development Team
- 1 Full-stack Engineer (React Native + Backend)
- 1 UI/UX Designer (design systems, user flows)
- 1 QA Engineer (testing, edge cases)
- 1 DevOps Engineer (CI/CD, deployment)

### Infrastructure
- Supabase PostgreSQL database
- Supabase Storage for video assets
- Expo EAS for CI/CD builds
- Sentry for error tracking
- Firebase Analytics for user behavior

### Budget Estimate
- **Development:** $60k - $80k
- **Infrastructure:** $500/month ongoing
- **Marketing:** $10k - $20k for launch

---

## Success Definition

The project is successful when:

1. **Technical**
   - MVP deployed to App Store and Google Play
   - Zero critical bugs for 30 days
   - Page load time < 3 seconds
   - 99.9% API uptime

2. **User**
   - 10k downloads achieved
   - 4.0+ star rating on app stores
   - 25%+ 30-day retention rate

3. **Business**
   - Sustain operations with ads or freemium model
   - Path to profitability within 12 months

---

## Assumptions

1. Expo framework remains actively maintained and supported
2. Supabase is a reliable backend partner
3. FFmpeg Kit integrates without major issues
4. Users have smartphones with decent cameras
5. Market wants lightweight highlight tool
6. iOS App Store approval is granted
7. Android Play Store approval is granted
8. Users willing to grant camera/microphone permissions

---

## Constraints

1. iOS requires Mac for build (team doesn't have Mac)
   - Solution: Use EAS Build cloud service

2. App Store review cycle 24-48 hours
   - Mitigation: Plan release timeline accordingly

3. Firebase/Supabase free tier has limits
   - Mitigation: Budget for paid tier as user base grows

4. React Native limitations for advanced video effects
   - Mitigation: Use FFmpeg for complex processing, keep effects simple

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-31 | Engineering | Phase 1 completion, all phases defined |

---

## Next Steps

1. Begin Phase 2 implementation
2. Set up Supabase project and database schema
3. Design authentication screens
4. Plan camera integration
5. Create detailed task breakdown for sprint planning
