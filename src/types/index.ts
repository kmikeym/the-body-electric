// Fireproof document types
export interface WeighIn {
  _id: string; // dateISO (e.g., "2025-10-02")
  weightKg: number;
  note?: string;
  type: 'weighin';
}

export interface Settings {
  _id: 'settings';
  unit: 'kg' | 'lb';
  alpha: number; // EWMA smoothing factor
  caloriePerKg: number;
  type: 'settings';
}

// Computed types
export interface TrendPoint {
  date: string;
  weightKg: number;
  trendKg: number;
  slopeKgPerDay?: number;
  kcalPerDay?: number;
}
