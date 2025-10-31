# Assign to Who?

Clinician assignment recommendation system using assignment-based scoring.

## Overview

This application calculates assignment scores for clinicians based on four metrics: active cases, current month hours, 6-month average hours, and assignment growth rate. Lower scores indicate lower assignments and higher availability.

## Scoring Formula

```
S = 100 × [0.30 × (AC/max) + 0.30 × (CM/max) + 0.30 × (M6/max) + 0.10 × ((GR-min)/(max-min))]
```

**Components:**
- Active Cases (30%): Clients seen in last 2 months
- Current Month (30%): Clinical hours in current month (dynamically calculated)
- 6-Month Average (30%): Average hours over last 6 months (dynamically calculated)
- Growth Rate (10%): Current month vs individual historical baseline (6-month average)

**Normalization:** All metrics normalized across entire clinician population, not per-level. This ensures cross-level comparability (e.g., a lead with 2 cases scores lower than a junior with 25 cases).

## Recommendation Levels

- Green (≤40): Highly recommended
- Yellow (41-70): Recommended
- Red (>70): Consider alternatives

## Clinicians

**Junior:** Andrew Lim, Janice Leong, Xiao Hui, Oliver Tan, Seanna Neo

**Senior:** Kirsty Png, Dominic Yeo, Jiaying, Claudia Stefanie, John Leow

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

Last Updated: 31 October 2025

### Automatic Data Updates

To automatically regenerate data when `ALL-HOURS.csv` changes:

```bash
pip install -r requirements.txt
python watch_and_update.py
```

See `AUTO_UPDATE.md` for detailed setup instructions including background service configuration.
