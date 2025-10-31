"""
File Watcher for Automatic Clinician Summary Generation

This script monitors ALL-HOURS.csv for changes and automatically runs
backend.py to regenerate clinician_summary.csv whenever the file is modified.

Usage:
    python watch_and_update.py

Requirements:
    pip install watchdog
"""

import time
import subprocess
import sys
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class CSVFileHandler(FileSystemEventHandler):
    def __init__(self, csv_file, script_to_run):
        self.csv_file = Path(csv_file).resolve()
        self.script_to_run = script_to_run
        self.last_modified = time.time()
        print(f"Watching: {self.csv_file}")
        print(f"Will run: {self.script_to_run}")
        print("-" * 60)

    def on_modified(self, event):
        # Check if the modified file is our target CSV
        if event.src_path.endswith('ALL-HOURS.csv'):
            # Debounce: ignore rapid successive events (within 2 seconds)
            current_time = time.time()
            if current_time - self.last_modified < 2:
                return

            self.last_modified = current_time
            print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] Detected change in ALL-HOURS.csv")
            print("Running backend.py to regenerate clinician_summary.csv...")

            try:
                # Run backend.py
                result = subprocess.run(
                    [sys.executable, self.script_to_run],
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                if result.returncode == 0:
                    print("✓ Successfully regenerated clinician_summary.csv")
                    if result.stdout:
                        print(result.stdout)
                else:
                    print("✗ Error running backend.py:")
                    print(result.stderr)

            except subprocess.TimeoutExpired:
                print("✗ Timeout: backend.py took longer than 60 seconds")
            except Exception as e:
                print(f"✗ Error: {e}")

            print("-" * 60)

def main():
    # Get the directory where this script is located
    script_dir = Path(__file__).parent
    csv_file = script_dir / 'ALL-HOURS.csv'
    backend_script = script_dir / 'backend.py'

    # Verify files exist
    if not csv_file.exists():
        print(f"Error: {csv_file} not found!")
        return

    if not backend_script.exists():
        print(f"Error: {backend_script} not found!")
        return

    # Create event handler and observer
    event_handler = CSVFileHandler(csv_file, backend_script)
    observer = Observer()
    observer.schedule(event_handler, str(script_dir), recursive=False)

    # Start watching
    observer.start()
    print("\nFile watcher is running...")
    print("Press Ctrl+C to stop")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping file watcher...")
        observer.stop()

    observer.join()
    print("File watcher stopped.")

if __name__ == "__main__":
    main()
