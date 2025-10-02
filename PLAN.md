# The Body Electric - MVP Implementation Plan

## Product Goal
Track daily weight, compute EWMA trend, surface slope and calorie delta, guide small adjustments.

## Core User Loop
1. Weigh in once per day
2. Review trend and 7-day slope
3. Adjust targets by small increments
4. Maintain

## KPIs
- Days with weigh-ins per 30 days
- Median absolute error between weight and trend
- Consecutive days trend within maintenance band

## MVP Stack
- **Frontend**: React + TypeScript, Vite
- **Database**: Fireproof (`@fireproof/core` + `@fireproof/react`)
- **Charts**: Recharts
- **Time**: date-fns

## Data Model

### Fireproof Documents
```ts
// Weigh-in document (one per day)
{
  _id: string,                 // dateISO (e.g., "2025-10-02")
  weightKg: number,
  note?: string,
  type: "weighin"
}

// Settings document (singleton)
{
  _id: "settings",
  unit: "kg" | "lb",
  alpha: 0.1,                  // EWMA smoothing factor
  caloriePerKg: 7700,
  type: "settings"
}
```

### Derived (computed client-side)
```ts
type TrendPoint = {
  date: string,
  weightKg: number,
  trendKg: number,
  slopeKgPerDay: number,       // 7-day slope
  kcalPerDay: number           // calorie delta
}
```

---

## Phase 1: Project Setup

### 1.1 Initialize Vite + React + TypeScript
- `npm create vite@latest . -- --template react-ts`
- Install dependencies:
  - `@fireproof/core @fireproof/react`
  - `recharts`
  - `date-fns`
- Clean up Vite boilerplate

### 1.2 Project Structure
```
the-body-electric/
├── src/
│   ├── components/
│   │   ├── WeighInForm.tsx
│   │   ├── TrendChart.tsx
│   │   ├── StatsPanel.tsx
│   │   └── SettingsToggle.tsx
│   ├── hooks/
│   │   ├── useWeighIns.ts      # Fireproof integration
│   │   └── useSettings.ts
│   ├── utils/
│   │   ├── ewma.ts             # EWMA calculations
│   │   └── units.ts            # kg ↔ lb conversion
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
└── vite.config.ts
```

---

## Phase 2: Fireproof Integration

### 2.1 Database Hooks
**File: `src/hooks/useWeighIns.ts`**
- Initialize: `useFireproof('body-electric')`
- Query: `useLiveQuery()` to fetch all weighins sorted by date
- Actions:
  - `addWeighIn(date: string, kg: number)` → `db.put({ _id: dateISO, weightKg, type: 'weighin' })`
  - `deleteWeighIn(id: string)` → `db.del(id)`

**File: `src/hooks/useSettings.ts`**
- Load settings doc from Fireproof
- `updateSettings(partial)` → merge and save
- Default settings if none exist

### 2.2 Why Fireproof?
- **Local-first**: Works offline, syncs when online
- **Zero backend**: Just import and use
- **Multi-device ready**: CRDT-based sync (enable when needed)
- **Ecosystem alignment**: Same stack as vibecoder

---

## Phase 3: EWMA Calculation Engine

**File: `src/utils/ewma.ts`**

### 3.1 EWMA Trend Calculation
```ts
// S_t = α × X_t + (1-α) × S_{t-1}
function computeTrend(weighIns: WeighIn[], alpha: number): TrendPoint[] {
  let trend = weighIns[0].weightKg;  // Initialize with first value

  return weighIns.map(w => {
    trend = alpha * w.weightKg + (1 - alpha) * trend;
    return {
      date: w._id,
      weightKg: w.weightKg,
      trendKg: trend
    };
  });
}
```

### 3.2 7-Day Slope
- Linear regression on last 7 trend points
- Returns slope in kg/day

### 3.3 Calorie Delta
```ts
kcalPerDay = -slopeKgPerDay * 7700  // negative because losing = deficit
```

---

## Phase 4: UI Components

### 4.1 WeighInForm
- Input: weight (number)
- Date: defaults to today (ISO string)
- Button: "Add Weigh-In"
- On submit: call `addWeighIn()` from hook

### 4.2 TrendChart (Recharts)
- LineChart with two series:
  1. Scatter plot (raw weight data points)
  2. Line (EWMA trend)
- X-axis: dates (last 30 days)
- Y-axis: weight in selected unit
- Tooltip: date, weight, trend value

### 4.3 StatsPanel
- Current trend: `{trendKg}` kg
- 7-day slope: `{slope}` kg/day
- Calorie delta: `{kcal}` kcal/day
- Color coding: green (deficit), red (surplus), yellow (maintenance)

### 4.4 SettingsToggle
- Unit toggle: kg ↔ lb
- Display alpha value (fixed at 0.1 for MVP)
- Clear all data button (with confirmation)

---

## Phase 5: Layout & Styling

### 5.1 Responsive Design
- **Mobile**: Single column (form → chart → stats)
- **Desktop**: Two columns (chart left, form+stats right)
- Teal/cyan theme matching landing page branding

### 5.2 Data Flow
1. User enters weight → `addWeighIn()` → Fireproof `db.put()`
2. `useLiveQuery()` triggers re-render with new data
3. EWMA calculation runs on updated data
4. Chart and stats update automatically (reactive)

---

## Phase 6: Deployment

### 6.1 Build & Deploy
- `npm run build` → static assets
- Deploy to Cloudflare Pages
- Custom domain: `body.quarterly.systems`
- Update `/apps` page to link to new subdomain

### 6.2 Documentation
- Update README.md with:
  - Setup instructions
  - EWMA algorithm explanation
  - How to interpret trend and slope
- Add CLAUDE.md with architecture decisions

---

## What's NOT in MVP
❌ PWA manifest/service worker (just a web app for now)
❌ Notes field (date + weight only)
❌ Goal modes (cut/maintain/gain - just show numbers)
❌ Advanced settings UI (fixed alpha = 0.1)
❌ Data export/import
❌ Fireproof cloud sync (local-only, but foundation ready)

---

## Post-MVP Enhancements
- Enable Fireproof cloud sync for multi-device
- PWA with offline support
- Goal modes and maintenance bands
- Notes field per weigh-in
- Export to CSV/JSON
- Notification reminders
- Multiple metrics (body fat %, measurements)

---

## Success Criteria
✓ Add weigh-in in < 10 seconds
✓ Trend updates instantly (Fireproof live query)
✓ Chart shows last 30 days clearly
✓ 7-day slope and calorie delta visible
✓ Data persists across sessions (Fireproof local storage)
✓ Responsive on mobile and desktop
✓ Deployed to body.quarterly.systems
