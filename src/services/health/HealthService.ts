// Shared interface for accessing health data across platforms.
// This interface defines methods to request permissions, check availability,
// and read step counts for today and a range of dates.
export interface DailyStepEntry {
  /**
   * ISO 8601 date string (YYYY-MM-DD) representing the day of the entry.
   */
  date: string;
  /**
   * Number of steps taken on the given date.
   */
  steps: number;
}

export interface HealthService {
  /**
   * Checks if health data is available on the current platform. For example,
   * HealthKit on iOS or Health Connect on Android may not be installed or
   * may be disabled by the user. Returns a boolean indicating availability.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Requests permission to read the user's step count. Should be called
   * during onboarding. Returns true if permission was granted.
   */
  requestPermissions(): Promise<boolean>;

  /**
   * Returns the step count for the current day. If data is not available or
   * permission has been denied, resolves to 0. The implementation should
   * always return a number and never reject.
   */
  getTodaySteps(): Promise<number>;

  /**
   * Returns an array of step entries for each day in the inclusive range
   * between `start` and `end`. Dates should be provided as native Date
   * objects and converted to midnight local time in implementations. The
   * result array must include an entry for every date in the range, even
   * those without recorded steps (use steps = 0 for missing days).
   */
  getDailyStepsRange(start: Date, end: Date): Promise<DailyStepEntry[]>;
}
