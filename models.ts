/**
 * Type definitions for persistent data structures used by the app.
 */

/**
 * Enumeration of supported BMR formulas. Extend this enum when adding new
 * formulas (e.g., Harris–Benedict).
 */
export type BmrFormula = 'mifflin';

/**
 * User profile containing static anthropometrics and preferences. Weight
 * should reflect the most recent entry from `weightLogs`. Step length is
 * stored explicitly so that user overrides persist.
 */
export interface Profile {
  id: string;
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  sex: 'male' | 'female' | 'other';
  heightM: number;
  weightKg: number;
  stepLengthM: number;
  bmrFormula: BmrFormula;
}

/**
 * Record of a user's weight on a specific date. Dates are stored as ISO
 * strings with no time component.
 */
export interface WeightLogEntry {
  date: string;
  weightKg: number;
}

/**
 * Summary of a day's activity and calorie expenditure.
 */
export interface DailySummary {
  date: string;
  steps: number;
  distanceKm: number;
  kcalWalk: number;
  bmrKCal: number;
  tdee: number;
}