import { WeighIn, TrendPoint } from '../types';

/**
 * Compute EWMA trend from weigh-in data
 * S_t = α × X_t + (1-α) × S_{t-1}
 */
export function computeTrend(weighIns: WeighIn[], alpha: number): TrendPoint[] {
  if (weighIns.length === 0) return [];

  let trend = weighIns[0].weightKg; // Initialize with first value

  return weighIns.map(w => {
    trend = alpha * w.weightKg + (1 - alpha) * trend;
    return {
      date: w._id,
      weightKg: w.weightKg,
      trendKg: trend,
    };
  });
}

/**
 * Calculate 7-day slope using linear regression
 * Returns slope in kg/day
 */
export function calculate7DaySlope(trendPoints: TrendPoint[]): number {
  if (trendPoints.length < 2) return 0;

  // Take last 7 points (or all if less than 7)
  const points = trendPoints.slice(-7);
  const n = points.length;

  // Convert dates to numeric x values (days from first point)
  const firstDate = new Date(points[0].date).getTime();
  const xy: [number, number][] = points.map(p => {
    const x = (new Date(p.date).getTime() - firstDate) / (1000 * 60 * 60 * 24);
    return [x, p.trendKg];
  });

  // Linear regression: y = mx + b, solve for m (slope)
  const sumX = xy.reduce((sum, [x]) => sum + x, 0);
  const sumY = xy.reduce((sum, [_, y]) => sum + y, 0);
  const sumXY = xy.reduce((sum, [x, y]) => sum + x * y, 0);
  const sumX2 = xy.reduce((sum, [x]) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

/**
 * Calculate calorie surplus/deficit from slope
 * Negative slope = deficit, positive = surplus
 */
export function caloriePerDay(slopeKgPerDay: number, caloriePerKg: number = 7700): number {
  return -slopeKgPerDay * caloriePerKg;
}

/**
 * Add slope and calorie data to trend points
 */
export function enrichTrendWithSlope(
  trendPoints: TrendPoint[],
  caloriePerKg: number = 7700
): TrendPoint[] {
  if (trendPoints.length < 2) return trendPoints;

  const slope = calculate7DaySlope(trendPoints);
  const kcal = caloriePerDay(slope, caloriePerKg);

  // Add slope and kcal to all points (same value for all)
  return trendPoints.map(p => ({
    ...p,
    slopeKgPerDay: slope,
    kcalPerDay: kcal,
  }));
}
