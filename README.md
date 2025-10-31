# Assign to Who?

Clinician assignment recommendation system using workload-based scoring.

## Overview

This application calculates assignment scores for clinicians based on four metrics: active cases, current month hours, 6-month average hours, and workload growth rate. Lower scores indicate lower workload and higher availability.

## Scoring Formula

```
S = 100 × [0.40 × (AC/max) + 0.25 × (CM/max) + 0.25 × (M6/max) + 0.10 × ((GR-min)/(max-min))]
```

**Components:**
- Active Cases (40%): Clients seen in last 2 months
- Current Month (25%): Clinical hours in October 2025
- 6-Month Average (25%): Average hours May-October 2025
- Growth Rate (10%): Workload trajectory (Aug-Oct vs May-Jul)

**Normalization:** All metrics normalized across entire clinician population, not per-level. This ensures cross-level comparability (e.g., a lead with 2 cases scores lower than a junior with 25 cases).

## Recommendation Levels

- Green (≤40): Highly recommended
- Yellow (41-70): Recommended
- Red (>70): Consider alternatives

## Clinicians

**Junior:** Andrew Lim, Janice Leong, Xiao Hui, Oliver Tan, Seanna Neo

**Senior:** Kirsty Png, Dominic Yeo, Jiaying, Claudia Stefanie

**Lead:** Haikel, Joanna Tan

## Installation

```bash
npm install
npm run dev
```

## Technology

- React 18
- Vite
- Recharts
- CSS Variables

## Data

Source: `clinician_summary.csv` (generated from `backend.py`)

Last Updated: 30 October 2025

### Automatic Data Updates

To automatically regenerate data when `ALL-HOURS.csv` changes:

```bash
pip install -r requirements.txt
python watch_and_update.py
```

See `AUTO_UPDATE.md` for detailed setup instructions including background service configuration.
