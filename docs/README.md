# My2Light v2 Documentation

Welcome to the My2Light v2 documentation. This folder contains comprehensive guides for developing, maintaining, and extending the application.

**Current Phase:** Phase 1 - Foundation & Setup (Complete)
**Last Updated:** 2025-12-31
**Documentation Version:** 1.0

---

## Quick Navigation

### For New Developers
Start here to understand the project:
1. Read **[codebase-summary.md](./codebase-summary.md)** (5 min read)
2. Read **[code-standards.md](./code-standards.md)** (15 min read)
3. Review **[system-architecture.md](./system-architecture.md)** (10 min read)

### For Product Managers & Stakeholders
Understand project scope and timeline:
- **[project-overview-pdr.md](./project-overview-pdr.md)** - Complete product definition, 6-phase roadmap, requirements, timeline

### For Architects & Senior Developers
Deep dive into system design:
- **[system-architecture.md](./system-architecture.md)** - Layered architecture, technology decisions, data flows, scalability

### For Daily Development
Quick reference for coding:
- **[code-standards.md](./code-standards.md)** - Naming conventions, patterns, error handling, best practices

### For Understanding the Codebase
Comprehensive reference:
- **[codebase-summary.md](./codebase-summary.md)** - Tech stack, structure, data models, design system, constants

---

## Documentation Files

### 1. [codebase-summary.md](./codebase-summary.md)
**Purpose:** High-level overview of codebase
**Length:** ~800 words | **Read Time:** 5 minutes
**Key Topics:**
- Project structure and organization
- Technology stack with versions
- Core data models (Video, Highlight, Clip, Reel)
- Design system (colors, spacing, tokens)
- Storage layer
- Dependencies
- Build scripts

**Use When:** You need to understand what technologies are used and where things are located

---

### 2. [code-standards.md](./code-standards.md)
**Purpose:** Establish coding conventions and patterns
**Length:** ~1,290 words | **Read Time:** 15 minutes
**Key Topics:**
- Directory structure
- TypeScript standards
- Path aliases
- Type definitions
- Styling with NativeWind + Tailwind
- Storage patterns
- State management (Zustand)
- Component structure
- Import organization
- Naming conventions
- Error handling
- Code quality
- Phase 1 checklist
- Phase 2+ roadmap

**Use When:** You're writing code and need to follow project conventions

---

### 3. [system-architecture.md](./system-architecture.md)
**Purpose:** Document system design and architecture decisions
**Length:** ~1,359 words | **Read Time:** 10 minutes
**Key Topics:**
- Layered architecture diagram
- Technology stack
- 9 core systems (routing, types, storage, design, state, components, hooks, services, media)
- Data flow patterns
- Security architecture
- Performance optimization
- Scalability considerations
- Deployment architecture
- Monitoring setup

**Use When:** You need to understand how components interact or make architectural decisions

---

### 4. [project-overview-pdr.md](./project-overview-pdr.md)
**Purpose:** Complete product definition and requirements
**Length:** ~2,358 words | **Read Time:** 20 minutes
**Key Topics:**
- Executive summary and vision
- Phase breakdown (Phase 1-6 with timelines)
- 48 functional requirements
- Non-functional requirements
- Technical decisions with rationale
- Acceptance criteria
- Success metrics
- Risk assessment and mitigations
- Timeline and milestones
- Resource requirements
- Assumptions and constraints

**Use When:** You need to understand what the product does or what should be built next

---

## Phase Timeline

| Phase | Status | Duration | Target | Description |
|-------|--------|----------|--------|-------------|
| **Phase 1** | ✓ Complete | 1 week | Dec 31, 2025 | Foundation & Setup (YOU ARE HERE) |
| **Phase 2** | Pending | 2 weeks | Jan 14, 2026 | Auth + Recording |
| **Phase 3** | Pending | 2 weeks | Jan 28, 2026 | Highlights & Editing |
| **Phase 4** | Pending | 2 weeks | Feb 11, 2026 | Music & Export |
| **Phase 5** | Pending | 2 weeks | Feb 25, 2026 | Cloud Sync & Profiles |
| **Phase 6** | Pending | 3 weeks | Mar 18, 2026 | AI & Social |

See [project-overview-pdr.md](./project-overview-pdr.md) for detailed phase breakdown.

---

## Technology Stack Quick Reference

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **UI Framework** | React | 19.1.0 | Components and UI |
| **Mobile** | React Native | 0.81.5 | Cross-platform |
| **Router** | Expo Router | ~6.0.21 | Navigation |
| **Expo SDK** | Expo | ~54.0.30 | Development platform |
| **Styling** | TailwindCSS + NativeWind | 3.4.19 + 4.2.1 | Styling system |
| **State Management** | Zustand | 5.0.9 | State (Phase 2+) |
| **Storage** | MMKV | 4.1.0 | Local persistence |
| **Backend** | Supabase | 2.89.0 | Cloud services |
| **Video Processing** | FFmpeg Kit | 6.0.2 | Video editing |
| **Language** | TypeScript | ~5.9.2 | Type safety |

See [codebase-summary.md](./codebase-summary.md) for complete list.

---

## Project Structure

```
my2light-v2/
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Home screen
├── src/
│   ├── components/              # Reusable UI (Phase 2+)
│   ├── features/                # Feature modules (Phase 2+)
│   ├── hooks/                   # Custom hooks (Phase 2+)
│   ├── lib/
│   │   ├── constants.ts         # Design tokens
│   │   └── storage.ts           # Storage wrapper
│   ├── stores/                  # Zustand stores (Phase 2+)
│   └── types/
│       └── index.ts             # Type definitions
├── docs/                         # Documentation (this folder)
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── app.json                     # Expo config
├── tailwind.config.js           # Tailwind theme
├── babel.config.js              # Babel config
├── metro.config.js              # Metro config
└── global.css                   # Tailwind styles
```

See [code-standards.md](./code-standards.md) for detailed structure.

---

## Key Concepts

### Design System
Centralized in `src/lib/constants.ts`:
- **Colors:** 11 semantic color tokens (background, primary, secondary, etc.)
- **Spacing:** 5-point scale (4, 8, 16, 24, 32 pixels)
- **Video Settings:** Defaults for highlight duration, clip duration range, speed options

### Data Models
Defined in `src/types/index.ts`:
- **Video:** Recording with metadata and highlights
- **Highlight:** Marked segment within a video
- **Clip:** Edited segment with timing and speed
- **Reel:** Composition of multiple clips with optional music

### Storage Keys
Managed in `src/lib/storage.ts`:
- `auth_token` - Authentication token
- `user_id` - Current user ID
- `videos` - Cached video metadata
- `settings` - User preferences

See [system-architecture.md](./system-architecture.md) for detailed architecture.

---

## Development Workflow

### Start Development
```bash
cd my2light-v2
npm install                    # Install dependencies
npm start                      # Start Expo dev server
npm run android               # Run on Android device/emulator
npm run ios                   # Run on iOS simulator
npm run web                   # Run in web browser
```

### Code Guidelines
1. Follow TypeScript strict mode
2. Use path aliases (`@/` imports)
3. Use semantic color tokens
4. Check [code-standards.md](./code-standards.md) for naming
5. Update tests when code changes

### Before Committing
1. Verify TypeScript compiles: `npm run type-check`
2. Review code against [code-standards.md](./code-standards.md)
3. Update relevant documentation
4. Commit with descriptive message

---

## Getting Help

### Understanding the Codebase
1. Start with [codebase-summary.md](./codebase-summary.md)
2. Look at the actual file location mentioned
3. Check [code-standards.md](./code-standards.md) for patterns

### Implementing a Feature
1. Check [project-overview-pdr.md](./project-overview-pdr.md) for requirements
2. Review [system-architecture.md](./system-architecture.md) for related systems
3. Follow patterns in [code-standards.md](./code-standards.md)
4. Test against acceptance criteria

### Architectural Decisions
1. Review [system-architecture.md](./system-architecture.md)
2. Check technology rationale in [project-overview-pdr.md](./project-overview-pdr.md)
3. Look at similar existing implementations
4. Ask in team channels for complex decisions

---

## Documentation Status

### Phase 1 - COMPLETE ✓
- [x] Codebase summary
- [x] Code standards
- [x] System architecture
- [x] Project overview & requirements
- [x] This README

### Phase 2+ - TO BE CREATED
- [ ] Setup & development guide
- [ ] API documentation
- [ ] Database schema
- [ ] Authentication flow
- [ ] Component examples
- [ ] Testing guide
- [ ] Troubleshooting guide

---

## Related Files

**Project Guidelines:**
- `/CLAUDE.md` - Project instructions and workflows

**Configuration:**
- `/package.json` - Dependencies and scripts
- `/tsconfig.json` - TypeScript configuration
- `/tailwind.config.js` - Tailwind theme
- `/app.json` - Expo configuration
- `/babel.config.js` - Babel configuration

**Generated Reference:**
- `/repomix-output.xml` - Complete codebase compaction

---

## Contributing to Documentation

### Update Triggers
- When adding new major features
- When changing architectural patterns
- When updating dependencies
- When creating new storage keys
- When adding design tokens

### Update Process
1. Identify which document(s) need updates
2. Make changes keeping consistency with existing sections
3. Update version history if applicable
4. Link to related sections
5. Test all code examples

### Review Checklist
- [ ] Markdown syntax is valid
- [ ] Code examples are accurate
- [ ] Links to other docs work
- [ ] Terminology is consistent
- [ ] Grammar and spelling checked
- [ ] Table of contents updated

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-31 | Initial documentation for Phase 1 completion |

---

## Questions?

Refer to the specific documentation file:
- **"How is the app structured?"** → [codebase-summary.md](./codebase-summary.md)
- **"What coding style should I use?"** → [code-standards.md](./code-standards.md)
- **"How do systems interact?"** → [system-architecture.md](./system-architecture.md)
- **"What should I build?"** → [project-overview-pdr.md](./project-overview-pdr.md)

---

**Generated:** 2025-12-31
**Next Update:** After Phase 2 completion
