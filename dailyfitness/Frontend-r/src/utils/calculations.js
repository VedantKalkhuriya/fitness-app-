// Simple, well-known formulas - kept as plain functions so components
// stay easy to read.

export function calculateBMI(weightKg, heightCm) {
  const weight = Number(weightKg);
  const height = Number(heightCm);
  if (!Number.isFinite(weight) || !Number.isFinite(height) || height <= 0) return null;
  const h = height / 100;
  return (weight / (h * h)).toFixed(1);
}

const ACTIVITY_MULTIPLIER = {
  sedentary: 1.2,
  active: 1.55,
  'very active': 1.9,
};

// Mifflin-St Jeor equation for daily calorie needs
export function calculateDailyCalories({ weight, height, age, activity }) {
  const w = Number(weight);
  const h = Number(height);
  const a = Number(age);
  if (![w, h, a].every(Number.isFinite) || h <= 0) return null;

  const bmr = 10 * w + 6.25 * h - 5 * a + 5;
  const multiplier = ACTIVITY_MULTIPLIER[activity] || 1.375;
  return Math.round(bmr * multiplier);
}
