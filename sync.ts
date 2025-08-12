import { HealthService } from './HealthService';
import { Profile, DailySummary } from '../../core/models';
import { bmrMifflin, distanceKm, walkKCal, tdeeFromSteps } from '../../core/calc';
import { loadDailySummaries, saveDailySummaries } from '../../core/storage';

/**
 * Synchronises daily summaries by reading step counts from the provided
 * HealthService and computing TDEE using the user's profile. This function
 * ensures that there is one summary per day up to and including today. It
 * loads existing summaries, appends missing days, and persists the result.
 *
 * @param healthService Platform-specific implementation for reading steps.
 * @param profile Current user profile, containing step length and weight.
 */
export async function syncDailySummaries(
  healthService: HealthService,
  profile: Profile,
): Promise<DailySummary[]> {
  // Load existing summaries, sorted by date ascending
  const existing = (await loadDailySummaries()).sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date();
  const startDate = existing.length > 0 ? new Date(existing[existing.length - 1].date) : new Date(profile.dateOfBirth ?? today);
  // Start one day after the last summary to avoid duplicate entries
  if (existing.length > 0) {
    startDate.setDate(startDate.getDate() + 1);
  }
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // If no new days, return existing
  if (startDate > endDate) {
    return existing;
  }
  const newSummaries: DailySummary[] = [];
  const daysToFetch = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000) + 1;
  for (let i = 0; i < daysToFetch; i++) {
    const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const [stepEntry] = await healthService.getDailyStepsRange(date, date);
    const steps = stepEntry?.steps ?? 0;
    const stepLen = profile.stepLengthM;
    const distance = distanceKm(steps, stepLen);
    const kcalWalk = walkKCal(profile.weightKg, distance);
    // Convert height to cm for BMR calculation
    const heightCm = profile.heightM * 100;
    const ageYears = profile.dateOfBirth
      ? Math.floor((date.getTime() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 30; // default age if dob not set
    const bmr = bmrMifflin(profile.weightKg, heightCm, ageYears, profile.sex === 'male' ? 'male' : 'female');
    const tdee = tdeeFromSteps({ bmrKCal: bmr, weightKg: profile.weightKg, steps, stepLengthM: stepLen });
    newSummaries.push({
      date: date.toISOString().slice(0, 10),
      steps,
      distanceKm: distance,
      kcalWalk,
      bmrKCal: bmr,
      tdee,
    });
  }
  const all = existing.concat(newSummaries);
  await saveDailySummaries(all);
  return all;
}