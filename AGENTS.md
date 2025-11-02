# Repository Guidelines

## Project Structure & Module Organization
StickerGuard is a React Native + TypeScript app. Runtime code sits in `src/`, with UI under `components/` and `screens/`. State lives in `stores/` (Zustand) and business logic in `services/`. Firebase calls are centralized in `api/`, hooks in `hooks/`, and shared helpers in `utils/`. Navigation stacks and tabs live in `navigation/`. Assets belong in `src/assets/`. Platform configs (`ios/StickerGuard`, `android/app`) hold native files and the Firebase plist/json. Reference `ARCHITECTURE.md` for higher-level diagrams before reshaping modules.

## Build, Test, and Development Commands
Run `npm install` once, followed by `cd ios && pod install` whenever native libs change. `npm start` launches Metro. Use `npm run ios` or `npm run android` to boot the app in a simulator/emulator tied to the running packager. `npm test` executes the Jest suite, and `npm run lint` applies the React Native ESLint rules.

## Coding Style & Naming Conventions
Follow ESLint config `@react-native/eslint-config` and Prettier defaults (two-space indent, trailing commas). Components and screens use `PascalCase.tsx`; hooks/utilities prefer `camelCase.ts`. Create styles in `Component.styles.ts` so they can be imported alongside the component. Leverage TypeScript strict mode; avoid `any` and instead extend the types in `models/`. Imports should use the tsconfig path aliases, e.g., `import { locationService } from '@services/locationService';`.

## Testing Guidelines
Author Jest tests near the code as `__tests__/` folders or `*.test.ts(x)`. Mock native and Firebase modules with helpers in `src/api/__mocks__/` (add new ones when needed). Cover success, failure, and permission edge cases for location, timer, and notification flows. Note any unavoidable coverage gaps in the PR description, especially for camera or geofencing logic tied to device APIs.

## Commit & Pull Request Guidelines
Use Conventional Commits such as `feat(check-in): enforce timer escalation` or `fix(auth): restore token refresh`. Keep commits focused and prefer smaller PRs. Each PR should summarize the change, include manual test notes (`iPhone 15 Pro | prod build | pass`), attach screenshots for UI tweaks, and link Jira/GitHub issues. Request review from the mobile platform lead and wait for CI green before merging to `main`.

## Security & Configuration Tips
Never commit secrets or production Firebase credentials. Store `GoogleService-Info.plist` and `google-services.json` locally and distribute through the mobile secrets vault. Ensure debug builds point to staging Firebase keys. When working with background location, double-check Info.plist strings mirror security policy language before submitting builds.
