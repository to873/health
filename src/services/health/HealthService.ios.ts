import * as HealthKit from '@kingstinct/react-native-healthkit';
import { HealthService, DailyStepEntry } from './HealthService';

/**
 * iOS implementation of the HealthService using HealthKit. It wraps the
 * `@kingstinct/react-native-healthkit` module to request permissions and
 * query step counts. Methods return fallbacks when data is unavailable.
 */
export class HealthServiceIOS implements HealthService {
  async isAvailable(): Promise<boolean> {
    // Check if HealthKit is available on this device.
    try {
      return await HealthKit.isHealthDataAvailable();
    } catch (e) {
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const permissions: HealthKit.HealthKitPermissions = {
        permissions: {
          read: [HealthKit.Constants.Permissions.StepCount],
          write: [],
        },
      };
      await HealthKit.initHealthKit(permissions);
      return true;
    } catch (e) {
      return false;
    }
  }

  async getTodaySteps(): Promise<number> {
    try {
      // Query step count for today using midnight boundaries in local time.
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const results = await HealthKit.getStepCount({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      return results.value ?? 0;
    } catch (e) {
      return 0;
    }
  }

  async getDailyStepsRange(start: Date, end: Date): Promise<DailyStepEntry[]> {
    // Ensure start <= end
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (startDate > endDate) {
      return [];
    }
    const entries: DailyStepEntry[] = [];
    const oneDay = 24 * 60 * 60 * 1000;
    for (let d = new Date(startDate); d <= endDate; d = new Date(d.getTime() + oneDay)) {
      const nextDay = new Date(d.getTime() + oneDay);
      try {
        const result = await HealthKit.getStepCount({
          startDate: d.toISOString(),
          endDate: nextDay.toISOString(),
        });
        entries.push({ date: d.toISOString().slice(0, 10), steps: result.value ?? 0 });
      } catch (e) {
        entries.push({ date: d.toISOString().slice(0, 10), steps: 0 });
      }
    }
    return entries;
  }
}
