import { HealthService, DailyStepEntry } from './HealthService';

/*
 * Android implementation of the HealthService using Health Connect. This
 * implementation relies on the `react-native-health-connect` library. Because
 * the API surface may evolve, please consult the library's documentation for
 * exact method names. The stubs below illustrate the intended logic:
 *
 *  - Check availability via HealthConnectClient.isAvailable().
 *  - Request read permissions for step count records.
 *  - Query step counts for a given time range via getRecords().
 */
export class HealthServiceAndroid implements HealthService {
  async isAvailable(): Promise<boolean> {
    try {
      const HealthConnect = require('react-native-health-connect');
      if (typeof HealthConnect.isAvailable === 'function') {
        return await HealthConnect.isAvailable();
      }
      // Fallback: assume available if module is present
      return true;
    } catch (e) {
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const HealthConnect = require('react-native-health-connect');
      const permissions = [
        // Replace with actual permission constant for reading step count
        HealthConnect.Permissions.READ_STEP_COUNT,
      ];
      if (typeof HealthConnect.requestPermission === 'function') {
        await HealthConnect.requestPermission(permissions);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  async getTodaySteps(): Promise<number> {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const [entry] = await this.getDailyStepsRange(start, start);
      return entry?.steps ?? 0;
    } catch (e) {
      return 0;
    }
  }

  async getDailyStepsRange(start: Date, end: Date): Promise<DailyStepEntry[]> {
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (startDate > endDate) {
      return [];
    }
    const HealthConnect = require('react-native-health-connect');
    const entries: DailyStepEntry[] = [];
    const oneDay = 24 * 60 * 60 * 1000;
    for (let d = new Date(startDate); d <= endDate; d = new Date(d.getTime() + oneDay)) {
      const nextDay = new Date(d.getTime() + oneDay);
      try {
        if (typeof HealthConnect.getSteps === 'function') {
          // Some versions expose a convenience getSteps(startDate, endDate)
          const steps: number = await HealthConnect.getSteps(d, nextDay);
          entries.push({ date: d.toISOString().slice(0, 10), steps: steps ?? 0 });
        } else if (typeof HealthConnect.getRecords === 'function') {
          // Fallback: query the StepsRecord via getRecords()
          const records = await HealthConnect.getRecords('Steps', d, nextDay);
          const steps = Array.isArray(records)
            ? records.reduce((sum: number, rec: any) => sum + (rec.count ?? 0), 0)
            : 0;
          entries.push({ date: d.toISOString().slice(0, 10), steps });
        } else {
          entries.push({ date: d.toISOString().slice(0, 10), steps: 0 });
        }
      } catch (e) {
        entries.push({ date: d.toISOString().slice(0, 10), steps: 0 });
      }
    }
    return entries;
  }
}
