import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, WeightLogEntry, DailySummary } from './models';

/** Keys used for AsyncStorage. Namespace keys to avoid collisions. */
const PROFILE_KEY = '@health_app/profile';
const WEIGHT_LOGS_KEY = '@health_app/weight_logs';
const DAILY_SUMMARIES_KEY = '@health_app/daily_summaries';

// ----- Profile -----

/**
 * Retrieves the stored user profile or null if none exists.
 */
export async function loadProfile(): Promise<Profile | null> {
  try {
    const json = await AsyncStorage.getItem(PROFILE_KEY);
    return json ? (JSON.parse(json) as Profile) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Persists the given profile to storage. The profile must be serialisable.
 */
export async function saveProfile(profile: Profile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    // Swallow errors silently for now
  }
}

// ----- Weight Logs -----

/**
 * Loads the entire history of weight logs. Returns an empty array if none
 * exist. The caller should sort entries if ordering matters.
 */
export async function loadWeightLogs(): Promise<WeightLogEntry[]> {
  try {
    const json = await AsyncStorage.getItem(WEIGHT_LOGS_KEY);
    return json ? (JSON.parse(json) as WeightLogEntry[]) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Adds a new weight log entry and persists the updated list. If an entry
 * already exists for the given date, it will be replaced.
 */
export async function addWeightLog(entry: WeightLogEntry): Promise<void> {
  const logs = await loadWeightLogs();
  const existingIndex = logs.findIndex((e) => e.date === entry.date);
  if (existingIndex >= 0) {
    logs[existingIndex] = entry;
  } else {
    logs.push(entry);
  }
  try {
    await AsyncStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    // ignore
  }
}

// 

/**
 * Deletes a weight log entry by date and persists the updated list.
 */
export async function deleteWeightLog(date: string): Promise<void> {
  const logs = await loadWeightLogs();
  const updatedLogs = logs.filter((entry) => entry.date !== date);
  try {
    await AsyncStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    // ignore
  }
}
----- Daily Summaries -----

/**
 * Loads all persisted daily summaries. Returns an empty array if none exist.
 */
export async function loadDailySummaries(): Promise<DailySummary[]> {
  try {
    const json = await AsyncStorage.getItem(DAILY_SUMMARIES_KEY);
    return json ? (JSON.parse(json) as DailySummary[]) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Replaces all daily summaries with the given list. Intended to be called
 * after computing new summaries (e.g., when syncing steps). For upserts,
 * callers should load the current list, update entries, and then call this
 * function.
 */
export async function saveDailySummaries(summaries: DailySummary[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_SUMMARIES_KEY, JSON.stringify(summaries));
  } catch (e) {
    // ignore
  }
}

// ----- Data Export & Reset -----

/**
 * Removes all persisted data from AsyncStorage. This includes the profile,
 * weight logs, and daily summaries. Use this for GDPR-compliant data
 * deletion flows. It resolves once all keys have been cleared. Errors are
 * silently ignored to avoid blocking the UI.
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([PROFILE_KEY, WEIGHT_LOGS_KEY, DAILY_SUMMARIES_KEY]);
  } catch (e) {
    // ignore
  }
}

/**
 * Exports all persisted data as a CSV string. The CSV will contain two
 * sections: one for weight logs and one for daily summaries. Each section
 * starts with a header row describing the columns. Weight logs include
 * `date` and `weightKg` columns. Daily summaries include `date`, `steps`,
 * `distanceKm`, `kcalWalk`, `bmrKCal`, and `tdee` columns. If no data
 * exists, returns an empty string. Consumers can use this string to share
 * or save the data (e.g. via the Share API).
 */
export async function exportDataAsCsv(): Promise<string> {
  const weightLogs = await loadWeightLogs();
  const summaries = await loadDailySummaries();
  let csv = '';
  if (weightLogs.length > 0) {
    csv += 'Weight Logs\n';
    csv += 'date,weightKg\n';
    for (const log of weightLogs) {
      csv += `${log.date},${log.weightKg}\n`;
    }
    csv += '\n';
  }
  if (summaries.length > 0) {
    csv += 'Daily Summaries\n';
    csv += 'date,steps,distanceKm,kcalWalk,bmrKCal,tdee\n';
    for (const s of summaries) {
      csv += `${s.date},${s.steps},${s.distanceKm},${s.kcalWalk},${s.bmrKCal},${s.tdee}\n`;
    }
  }
  return csv;
}
