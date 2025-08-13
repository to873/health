# Expo Preview (UI only)

This lets you run the app UI (on Windows + Android emulator) without native Health Connect/HealthKit.

## 1) Create a fresh Expo app

npx create-expo-app@latest health-ui
cd health-ui

## 2) Install UI deps used by our code

## 3) Copy our source
Copy the `src/` folder from this repo into your Expo project:
- From this repo: `src/`
- Into the Expo app: `health-ui/src/`

## 4) Drop in the Expo stub for HealthService
In the Expo app, create `src/services/health/HealthService.ts` with the stub below (or copy from `stubs/HealthService.expo.ts` in this repo).

## 5) Start Expo and run on Android

npx expo start

- In the Expo terminal, press `a` to open the Android emulator.

> Notes
- Steps will be `0` (no Health Connect in Expo).
- Onboarding, settings, weight logs, BMI badge, and charts all work.
- This is for UI preview only. For real step data, use the native RN app with Health Connect later.


- Scroll to the bottom. Under “Commit new file”, select **Create a new branch for this commit**.
- Branch name: `chore/expo-preview`
- Click **Propose new file**.

