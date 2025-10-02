# The Body Electric

Weight trend tracker using EWMA (Exponentially Weighted Moving Average) to smooth daily weight fluctuations and provide actionable insights.

## Overview

The Body Electric is part of the Quarterly Systems ecosystem, providing health and fitness tracking with a focus on weight management through statistical trend analysis.

## Features

- **Daily Weigh-In**: Quick weight entry (< 10 seconds)
- **EWMA Trend**: Smoothed trend line using exponential moving average (α = 0.1)
- **7-Day Slope**: Rate of weight change calculated via linear regression
- **Calorie Delta**: Estimated daily calorie surplus/deficit based on trend slope
- **Unit Toggle**: Switch between kg and lb
- **Local-First**: Data stored locally with Fireproof (optional cloud sync ready)

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite
- **Database**: Fireproof (local-first, CRDT-based)
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Time**: date-fns

## Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app runs at http://localhost:5173/

## How It Works

### EWMA Trend Calculation
```
S_t = α × X_t + (1-α) × S_{t-1}
```
- α (alpha) = 0.1 (smoothing factor)
- X_t = current weight measurement
- S_{t-1} = previous trend value

### 7-Day Slope
Linear regression on last 7 trend points to calculate kg/day or lb/day change rate.

### Calorie Estimation
```
kcal/day = -slope_kg/day × 7700
```
- Negative slope (weight loss) = calorie deficit
- Positive slope (weight gain) = calorie surplus
- ~±100 kcal/day = maintenance range

## Data Model

All data stored in Fireproof (IndexedDB):

**Weigh-In Document**:
```ts
{
  _id: "2025-10-02",      // dateISO
  weightKg: 82.5,
  type: "weighin"
}
```

**Settings Document**:
```ts
{
  _id: "settings",
  unit: "kg" | "lb",
  alpha: 0.1,
  caloriePerKg: 7700,
  type: "settings"
}
```

## Deployment

```bash
npm run build
# Deploy dist/ to Cloudflare Pages
```

Target URL: `body.quarterly.systems`

## Integration

Part of the Quarterly Systems platform at https://quarterly.systems/apps

## Future Enhancements

- Enable Fireproof cloud sync for multi-device
- PWA with offline support
- Goal modes (cut/maintain/gain)
- Notes per weigh-in
- CSV/JSON export
- Body composition metrics
