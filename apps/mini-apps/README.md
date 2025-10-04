# The Body Electric - Mini Apps

This directory contains the mini-app ecosystem for The Body Electric health and fitness platform.

## Structure

- **index.json** - Registry of all mini-apps with metadata and data endpoints
- **[app-name]/** - Individual mini-app directories

## Mini Apps

### Weight Tracker
**Status**: Active
**Category**: Body Composition
**Path**: `/weight-tracker`
**Data Endpoint**: `/api/weight-tracker/export`

EWMA-based weight tracking with calorie delta calculations.

## Adding a New Mini App

1. Create a new directory: `mini-apps/[app-name]/`
2. Add entry to `index.json`:
   ```json
   {
     "id": "app-name",
     "name": "App Name",
     "description": "Brief description",
     "path": "/app-name",
     "icon": "emoji",
     "category": "category-id",
     "status": "active",
     "dataEndpoint": "/api/app-name/export",
     "version": "1.0.0",
     "lastUpdated": "YYYY-MM-DD"
   }
   ```
3. Implement data export endpoint that returns standardized format

## Data Export Format

Each mini-app must expose a data endpoint that returns:

```json
{
  "appId": "weight-tracker",
  "lastUpdated": "2025-10-03T12:00:00Z",
  "summary": {
    "currentValue": 82.5,
    "unit": "kg",
    "trend": "decreasing",
    "changeRate": -0.2
  },
  "recentData": [...],
  "meta": {...}
}
```

## Categories

- **body-composition** - Weight, body fat, muscle mass
- **activity** - Movement, workouts, exercise
- **nutrition** - Diet, calories, macros
- **biometrics** - Heart rate, BP, sleep, etc.
