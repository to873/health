/**
 * Collection of pure functions for calculating health metrics.
 * These functions are deterministic and do not perform any I/O.
 */

/**
 * Computes Body Mass Index (BMI) given weight (kg) and height (m).
 * Returns a floating point value. No rounding is applied.
 */
export function bmi(weightKg: number, heightM: number): number {
  if (heightM <= 0) return 0;
  return weightKg / (heightM * heightM);
}

/**
 * Computes Basal Metabolic Rate (BMR) using the Mifflin–St Jeor equation.
 * Accepts weight (kg), height (cm), age (years), and a sex string. The sex
 * string must be either 'male' or 'female'. For non-binary options, callers
 * should prompt the user to select which formula they prefer; this function
 * will not guess.
 */
export function bmrMifflin(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female'
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/**
 * Estimates step length in metres based on height and sex.
 * See: https://academic.oup.com/ptj/article/83/10/1000/2805063 (approximation).
 * Male: 0.415 × height; female: 0.413 × height.
 */
export function estimateStepLengthM(heightM: number, sex: 'male' | 'female'): number {
  const factor = sex === 'male' ? 0.415 : 0.413;
  return heightM * factor;
}

/**
 * Converts step count to distance in kilometres given a step length in metres.
 */
export function distanceKm(steps: number, stepLengthM: number): number {
  return (steps * stepLengthM) / 1000;
}

/**
 * Estimates gross calories expended walking the provided distance. This
 * approximation uses 1.036 kcal per kg per km as suggested by various
 * exercise physiology references. Caller must provide body weight (kg) and
 * distance in km.
 */
export function walkKCal(weightKg: number, distanceKm: number): number {
  return 1.036 * weightKg * distanceKm;
}

/**
 * Computes total daily energy expenditure (TDEE) as the sum of basal
 * metabolic rate and calories burned through walking. This helper requires
 * precomputed BMR and step-derived calories. It does not account for TEF
 * (thermic effect of food) or additional activities.
 */
export function tdeeFromSteps(args: {
  bmrKCal: number;
  weightKg: number;
  steps: number;
  stepLengthM: number;
}): number {
  const { bmrKCal, weightKg, steps, stepLengthM } = args;
  const distance = distanceKm(steps, stepLengthM);
  const kcalWalk = walkKCal(weightKg, distance);
  return bmrKCal + kcalWalk;
}