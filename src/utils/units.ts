// Unit conversion utilities

const KG_TO_LB = 2.20462;

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}

export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

export function formatWeight(kg: number, unit: 'kg' | 'lb'): string {
  if (unit === 'lb') {
    return `${kgToLb(kg).toFixed(1)} lb`;
  }
  return `${kg.toFixed(1)} kg`;
}

export function formatSlope(kgPerDay: number, unit: 'kg' | 'lb'): string {
  if (unit === 'lb') {
    return `${kgToLb(kgPerDay).toFixed(2)} lb/day`;
  }
  return `${kgPerDay.toFixed(2)} kg/day`;
}
