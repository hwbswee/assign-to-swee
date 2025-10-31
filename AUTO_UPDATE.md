# Automatic Data Update Setup

This guide explains how to automatically regenerate `clinician_summary.csv` whenever `ALL-HOURS.csv` changes.

## Option 1: GitHub Actions (Recommended for Production)

A GitHub Actions workflow is configured to automatically regenerate `clinician_summary.csv` whenever `ALL-HOURS.csv` is pushed to the repository.

### How It Works

1. Push changes to `ALL-HOURS.csv` to GitHub
2. GitHub Actions automatically detects the change
3. Workflow runs `backend.py` to regenerate `clinician_summary.csv`
4. Updated summary file is automatically committed and pushed back

### Setup

The workflow is pre-configured in `.github/workflows/update-clinician-summary.yml`. It triggers automatically on:
- Push to main branch when ALL-HOURS.csv changes
- Push to any claude/* branch when ALL-HOURS.csv changes

**No manual setup required** - just push your ALL-HOURS.csv changes to GitHub.

### Verification

After pushing ALL-HOURS.csv changes:
1. Go to your repository on GitHub
2. Click "Actions" tab
3. Find the "Update Clinician Summary" workflow
4. View the run details and logs

## Option 2: File Watcher Script (Local Development)

### Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the watcher:
```bash
python watch_and_update.py
```

The script will:
- Monitor `ALL-HOURS.csv` for changes
- Automatically run `backend.py` when changes are detected
- Regenerate `clinician_summary.csv`
- Show status messages and any errors

### Running as Background Service

**Windows (PowerShell):**
```powershell
Start-Process python -ArgumentList "watch_and_update.py" -WindowStyle Hidden
```

**Linux/Mac (Terminal):**
```bash
nohup python watch_and_update.py > watcher.log 2>&1 &
```

To stop:
```bash
pkill -f watch_and_update.py
```

## Option 3: Scheduled Task (Alternative)

If you prefer periodic updates instead of real-time monitoring:

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., every 1 hour)
4. Action: Run `python backend.py` in your project directory

### Linux/Mac Cron Job

```bash
# Edit crontab
crontab -e

# Add line to run every hour
0 * * * * cd /path/to/assign-to-who && python backend.py
```

## Option 4: Manual Update

Simply run when needed:
```bash
python backend.py
```

## Troubleshooting

**Error: "watchdog module not found"**
- Solution: `pip install watchdog`

**Backend.py fails to run**
- Check that `ALL-HOURS.csv` exists
- Verify pandas is installed: `pip install pandas`
- Check file permissions

**Changes not detected**
- Ensure you're modifying `ALL-HOURS.csv` in the project directory
- Some editors create temporary files - save directly to ALL-HOURS.csv
