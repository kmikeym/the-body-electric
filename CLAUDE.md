# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Body Electric** is a weight trend tracker that uses EWMA (Exponentially Weighted Moving Average) to smooth daily weight fluctuations and provide actionable insights. Part of the Quarterly Systems ecosystem.

**Tech Stack**: React 18 + TypeScript, Vite, Fireproof (local-first database), Recharts, Tailwind CSS, date-fns

**Target URL**: `body.quarterly.systems` (Cloudflare Pages)

## Development Commands

```bash
# Install (legacy peer deps required for Fireproof compatibility)
npm install --legacy-peer-deps

# Dev server (runs on http://localhost:5173/)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Architecture

### Data Flow
1. **Fireproof Database** (`use-fireproof`): Local-first CRDT database stored in IndexedDB
   - Database name: `'body-electric'`
   - All data persists locally, cloud sync capability ready but not enabled

2. **Data Model**:
   - **WeighIn Document**: `{ _id: "2025-10-02", weightKg: 82.5, type: "weighin" }`
   - **Settings Document**: `{ _id: "settings", unit: "kg"|"lb", alpha: 0.1, caloriePerKg: 7700, type: "settings" }`

3. **Computation Pipeline** (see `src/utils/ewma.ts`):
   ```
   Raw Weight Data → EWMA Trend (α=0.1) → 7-Day Slope → Calorie Delta
   ```

### Key Files

**`src/hooks/useWeighIns.ts`**: Fireproof integration for weigh-in CRUD
- Uses `useLiveQuery()` for reactive data binding
- Filters by `type: 'weighin'` and sorts by date (`_id`)
- `addWeighIn(weightKg, date?)` - stores data with ISO date as `_id`

**`src/hooks/useSettings.ts`**: Manages app settings (unit, EWMA alpha, calorie conversion)

**`src/utils/ewma.ts`**: EWMA calculation engine
- `computeTrend()`: Calculates `S_t = α × X_t + (1-α) × S_{t-1}`
- `calculate7DaySlope()`: Linear regression on last 7 trend points
- `caloriePerDay()`: Converts slope to kcal/day (`slope × 7700 kcal/kg`)
- `enrichTrendWithSlope()`: Combines all calculations into `TrendPoint[]`

**`src/utils/units.ts`**: kg ↔ lb conversion and formatting

**`src/App.tsx`**: Main UI component
- Chart shows last 30 days (raw weight as dashed grey line, EWMA trend as solid teal)
- Stats panel displays current trend, 7-day slope, and calorie delta with color coding
- Form for daily weigh-in with date picker (defaults to today)

### EWMA Parameters
- **Alpha (α)**: 0.1 (smoothing factor, fixed in MVP)
  - Lower α = smoother trend, slower response to changes
  - Higher α = more responsive, less smoothing
- **Calorie Conversion**: 7700 kcal/kg (standard conversion for body weight)
- **Slope Window**: Last 7 trend points (7 days of data)

### Type System
All types defined in `src/types/index.ts`:
- `WeighIn`: Fireproof document for daily weight entries
- `Settings`: Fireproof document for app configuration
- `TrendPoint`: Computed type with raw weight, trend, slope, and calorie data

## Fireproof Usage Notes

- **Live Queries**: Use `useLiveQuery()` from `use-fireproof` for reactive data
- **Document IDs**: WeighIn docs use ISO date strings (`yyyy-MM-dd`) as `_id` to ensure uniqueness and sortability
- **Type Safety**: TypeScript types ignore Fireproof's incomplete type definitions where necessary (`@ts-ignore` for sort options)
- **Multi-device Ready**: CRDT-based sync ready to enable (not in MVP)

## Deployment

```bash
npm run build
# Deploy dist/ to Cloudflare Pages
```

Target domain: `body.quarterly.systems`

Update landing page at `quarterly-systems-landing/src/pages/apps.astro` when deploying.

## Integration with Quarterly Systems

- Branding: Teal/cyan theme, "a K5M company" footer
- Navigation: Links to https://quarterly.systems in footer
- Part of 4-product suite (VibeCode, Office, Status, Knowledge Base)
