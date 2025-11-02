# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sticker Guard** - iOS app for enforcing corporate security policy through automated camera sticker verification using location-based triggers and strict time constraints.

- **Framework**: React Native 0.76.1 + TypeScript
- **Backend**: Firebase (Firestore, Anonymous Auth, Cloud Functions, FCM)
- **State Management**: Zustand 5.0
- **Key Location**: Company headquarters at 37.2253811, 127.0706423 (300m radius)

## Development Commands

### Running the App

```bash
# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run tests
npm test

# Lint code
npm run lint
```

### iOS-Specific Development

```bash
# Install iOS dependencies
cd ios && pod install && cd ..

# Open Xcode project
open ios/StickerGuard.xcworkspace

# Build release version
cd ios
xcodebuild -workspace StickerGuard.xcworkspace \
           -scheme StickerGuard \
           -configuration Release \
           -archivePath build/StickerGuard.xcarchive \
           archive
```

## Architecture Overview

### Three-Tier Architecture

**Presentation Layer** (`src/screens/`, `src/components/`)
- Screens: Home, CheckIn, AccountLocked, Stats, Settings
- Main component: CameraView.tsx for real-time camera verification
- Navigation: React Navigation Stack Navigator in `src/navigation/`

**Business Logic Layer** (`src/services/`, `src/stores/`, `src/hooks/`)
- **Core Services**:
  - `locationService.ts`: Geofencing, company radius detection (300m)
  - `timerService.ts`: 45-minute countdown with 4 notification stages (0, 5, 15, 30 min)
  - `checkInService.ts`: Firestore check-in recording and validation
  - `lockService.ts`: Account locking and irreversible data deletion
  - `statsService.ts`: Streak calculation, badge unlocking, monthly statistics
- **State Management (Zustand)**: authStore, locationStore, checkInStore, timerStore
- **Custom Hooks**: useLocationTracking for real-time location monitoring

**Data Layer** (`src/api/`, `src/models/`)
- Firebase API: `firebaseApi.ts` for authentication, `firebase.ts` for configuration
- TypeScript models: User, CheckIn, Stats, Notification

### Critical Business Flow

```
Company Entry (300m radius) →
  Check if already checked today →
  If not checked:
    Start 45-min timer →
    Schedule 4 notifications (0, 5, 15, 30 min) →
    User performs check-in via camera →
    Cancel timer & update stats
  If timer expires (45 min):
    Lock account →
    Delete all data (irreversible) →
    Force reinstall required
```

## Key Technical Constraints

### Location Tracking
- **Battery Optimization**: Uses iOS Geofencing (not continuous GPS)
- Distance filter: 50m movement threshold
- Update interval: 15 minutes
- Expected battery usage: 3-5% per day
- Required permission: `NSLocationAlwaysAndWhenInUseUsageDescription`

### Timer System
- **Dual Implementation**: Local JavaScript timer + Cloud Functions backup
- Local timer uses `setTimeout` for 45-minute countdown
- Cloud Functions run every 1 minute to catch edge cases
- Critical: Must cancel timer on check-in completion to prevent false locks

### Camera Verification
- **Library**: react-native-vision-camera v4.6.3
- Uses rear camera only (`device='back'`)
- User manually confirms sticker presence (no AI/ML detection)
- iOS policy compliant: requires explicit user action
- Required permission: `NSCameraUsageDescription`

### Account Locking
- **Irreversible**: All data deletion is permanent
- Deletes: checkIns subcollection, stats document, local AsyncStorage
- Updates Firestore: `accountStatus: 'locked'`, `lockReason`, `lockedAt`
- Forces app reinstall - no recovery mechanism

## Firebase Integration

### Firestore Schema

```
users/{userId}
  ├── companyLocation: { latitude, longitude, radius }
  ├── accountStatus: 'active' | 'locked'
  ├── lastEnteredCompany: Timestamp
  ├── checkInDeadline: Timestamp (entry time + 45 min)
  ├── checkIns/{YYYY-MM-DD}
  │     ├── date: string
  │     ├── checkedAt: Timestamp | null
  │     ├── hasSticker: boolean
  │     └── enteredAt: Timestamp
  └── stats/current
        ├── currentStreak: number
        ├── longestStreak: number
        ├── totalCheckIns: number
        ├── perfectWeeks: number
        ├── badges: string[]
        └── monthlyStats: { [yearMonth]: { checkInDays, achievementRate } }
```

### Cloud Functions (To Be Implemented)

- `checkTimerExpiration`: Runs every 1 minute, checks for expired deadlines
- `onCheckInComplete`: Firestore trigger to auto-update statistics
- See `TECHNICAL_SPECS.md` lines 550-627 for implementation details

## Critical Implementation Details

### Streak Calculation Logic
The streak algorithm requires yesterday's check to continue the streak:
- If checked yesterday: `currentStreak += 1`
- If NOT checked yesterday: `currentStreak = 1` (streak resets)
- Always update: `longestStreak = max(longestStreak, currentStreak)`

Implementation in `src/services/statsService.ts`

### Today's Check-In Guard
**Critical requirement from planning doc**: Location service MUST check if user already checked in today BEFORE starting timer. This prevents duplicate timer starts and notification spam.

See `src/services/locationService.ts` - look for the hasCheckedToday validation logic.

### Notification Scheduling
Uses `@notifee/react-native` for local notifications:
- All 4 notifications scheduled at once when timer starts
- Each has unique ID: 'notify-0min', 'notify-5min', 'notify-15min', 'notify-30min'
- iOS critical alerts require: `criticalVolume: 1.0`, `interruptionLevel: 'timeSensitive'`
- Must cancel ALL notifications on check-in completion

### Circular Dependency Prevention
Several files have circular dependencies that are resolved via dynamic imports:
- `timerService` → `lockService` (uses dynamic import)
- `checkInService` → `statsService`, `timerService` (uses dynamic import)

Always use dynamic imports when services cross-reference each other.

## Path Aliases

TypeScript path aliases configured in `tsconfig.json` and `babel.config.js`:

```typescript
@components/* → src/components/*
@screens/* → src/screens/*
@services/* → src/services/*
@stores/* → src/stores/*
@models/* → src/models/*
@utils/* → src/utils/*
@api/* → src/api/*
@hooks/* → src/hooks/*
@navigation/* → src/navigation/*
```

Use these aliases in imports instead of relative paths for cleaner code.

## Testing Strategy

### Location Testing
Test at actual company coordinates (37.2253811, 127.0706423) for E2E validation.
For development, modify `COMPANY_LOCATION` in `src/utils/constants.ts` temporarily.

### Timer Precision Testing
45-minute timer must be accurate within ±30 seconds. Test both:
1. Local timer (JavaScript setTimeout)
2. Cloud Functions backup (scheduled every 1 minute)

### Battery Testing
Monitor battery drain over 24 hours. Target: <5% daily consumption.
Primary optimization: Geofencing instead of continuous GPS tracking.

## Common Development Pitfalls

1. **Timer not starting**: Ensure `timerService.startTimer()` is NOT commented out in `locationService.ts`
2. **Infinite recursion**: Private helper methods in services must have unique names (e.g., `clearTimerId` not `cancelTimer`)
3. **Missing today check**: Always validate if user checked in today before starting timer
4. **Streak calculation errors**: Verify yesterday's check-in status, not just today's
5. **Circular imports**: Use dynamic imports for cross-service dependencies
6. **Notification spam**: Cancel ALL scheduled notifications on check-in completion

## Phase Status

**Current Phase**: Phase 8 Complete (95% done)
- ✅ Architecture design
- ✅ Project setup
- ✅ Location tracking system
- ✅ Camera verification system
- ✅ 45-minute timer & notifications
- ✅ Account locking system
- ✅ UI/UX implementation
- ✅ Bug fixes and validation (9 critical bugs fixed)

**Next Phase**: Phase 9-10 (5% remaining)
- [ ] Firebase project creation and configuration
- [ ] Cloud Functions deployment
- [ ] Integration testing at company location
- [ ] Battery optimization validation

## Important Files

- `ARCHITECTURE.md`: Complete system architecture and data flow diagrams
- `TECHNICAL_SPECS.md`: Detailed feature specifications for all 5 core systems
- `DEVELOPMENT_STATUS.md`: Current progress, completed phases, bug fixes
- `스티커가드.md`: Original planning document (Korean) - source of truth for requirements
- `src/utils/constants.ts`: ALL app constants (location, timer, colors, badges)

## Firebase Configuration

**Required Setup** (not yet complete):
1. Create Firebase project at https://console.firebase.google.com
2. Register iOS app with Bundle ID: `com.stickerguard`
3. Download `GoogleService-Info.plist`
4. Place in `ios/StickerGuard/` directory
5. Enable: Firestore, Anonymous Authentication, Cloud Functions, FCM

Configuration files ready but not connected:
- `src/config/firebase.ts`: Firebase initialization
- `src/api/firebaseApi.ts`: Authentication helpers

## Performance Targets

- Location detection accuracy: >95% within 300m radius
- Notification timing accuracy: 99% (±30 seconds)
- Battery consumption: <5% per day
- Timer expiration accuracy: ±1 minute (local + cloud backup)
- App crash rate: <0.1%
