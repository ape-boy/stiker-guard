# Changelog

All notable changes to the Sticker Guard Android project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete Android project migration from iOS
- Android native implementation (MainActivity, MainApplication, FCMService, NotificationService, BootReceiver)
- Comprehensive AndroidManifest.xml with all required permissions
- ProGuard configuration for release builds
- GitHub Actions workflows for Android builds (debug and release)
- Firebase Android integration setup
- Android-specific documentation (README.md, CLAUDE.md)

### Changed
- Migrated from iOS-first to Android-exclusive application
- Updated package.json scripts for Android development
- Updated .gitignore for Android build artifacts
- Removed iOS-specific build workflows and dependencies

### Removed
- iOS build scripts and workflows from package.json
- iOS-specific GitHub Actions workflows
- iOS-specific development dependencies

## [1.0.0] - TBD

### Planned Features
- Location-based check-in system (300m company radius)
- 45-minute timer with 4-stage notifications
- Camera sticker verification
- Account locking for policy violations
- Statistics tracking and badge system
- Firebase Cloud Functions integration
- Google Play Store release

---

## Version History

### Version 1.0.0 (Planned)
**Release Date**: TBD
**Build**: 1

**New Features**:
- Initial Android release
- Location-based geofencing
- Camera verification system
- 45-minute timer with notifications
- Account locking mechanism
- Statistics and badges
- Firebase integration

**Technical Details**:
- Min SDK: 24 (Android 7.0)
- Target SDK: 34 (Android 14)
- React Native: 0.76.1
- Firebase BOM: 32.7.0
- Hermes JS Engine enabled

**Known Issues**:
- None currently reported

**Build Instructions**:
1. Ensure all Firebase credentials are configured
2. Place `google-services.json` in `android/app/`
3. Run `npm run android:release` for APK
4. Run `npm run android:bundle` for AAB
