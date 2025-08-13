// Minimal HealthService stub for Expo UI preview (no native Health Connect / HealthKit).
// Copy this into your Expo app as: src/services/health/HealthService.ts

export async function ensurePermissions(): Promise<boolean> {
  // No runtime permissions in this Expo preview
  return false;
}

export async function isHealthAppAvailable(): Promise<boolean> {
  // Health Connect / Health app not used in Expo
  return false;
}

export async function getTodaySteps(): Promise<number> {
  // No health source in Expo — return 0 so the UI renders
  return 0;
}

export type StepSample = { start: string; end: string; steps: number };

export async function getStepSamples(_: { start: Date; end: Date }): Promise<StepSample[]> {
  // Empty list just renders empty/zero states
  return [];
}
