
import pandas as pd
from datetime import datetime, timedelta

# Load the CSV file
df = pd.read_csv('ALL-HOURS.csv')

# Print unique column names

print(list(df.columns.unique()))
print('\nUnique appointment types:')
print(df['a_appointtype'].dropna().unique())

# Only include specified clinical appointment types
clinical_types = [
	'Wellbeing Individual Check-In',
	'Wellbeing Individual Counselling Session',
	'Couples Counselling',
	'Crisis',
	'Groupwork',
	'Client Contact',
	'Communication (External)',
	'Communication (Internal)',
	'Communication (Respondent)',
	# Accompaniment types
	'Accompaniment (Faculty/HRP)',
	'Accompaniment (Medical)',
	'Accompaniment (NUS Adjudication)',
	'Accompaniment (NUS Investigation)',
	'Accompaniment (Other)',
	'Accompaniment (Police)',
	# MHRTW types
	'MHRTW-Accompaniment',
	'MHRTW-Communication'
]


# List of current clinicians
current_clinicians = [
	'Andrew Lim', 'Claudia Stefanie', 'Dominic Yeo', 'Goh Zhengqin', 'Haikel',
	'John Leow', 'Kirsty Png', 'Leong Yee Teng Janice', 'Ng Xiao Hui', 'Oliver Tan',
	'Seanna Neo', 'Soon Jiaying', 'Tan Siew Kei Joanna Ashley'
]

# Normalize client IDs: strip HWB prefix if present
def normalize_clientid(cid):
	if isinstance(cid, str) and cid.startswith('HWB'):
		return cid.replace('HWB0000', '').replace('HWB', '')
	return str(cid)

df['a_centerclientid'] = df['a_centerclientid'].apply(normalize_clientid)


# Filter attended sessions, unique client IDs, only current clinicians, and clinical related sessions
# Adjust the filter below to match your clinical session indicator (e.g., a_service == 'Clinical' or a_appointtype == 'Clinical')
attended_df = df[
	df['a_scheduleattendance'].notnull() & (df['a_scheduleattendance'] != '') &
	df['a_centerclientid'].notnull() & (df['a_centerclientid'] != '') &
	df['a_schedule'].isin(current_clinicians) &
	df['a_codedescription'].isin(clinical_types)
].copy()

# Convert a_date to datetime (handle single/double digit day/month)
attended_df['a_date'] = pd.to_datetime(attended_df['a_date'], dayfirst=True, errors='coerce')

# Drop rows where a_date conversion failed
attended_df = attended_df.dropna(subset=['a_date'])

# Ensure a_date is datetime64[ns] type
attended_df['a_date'] = pd.to_datetime(attended_df['a_date'])

# Ensure a_length is numeric
attended_df['a_length'] = pd.to_numeric(attended_df['a_length'], errors='coerce')

# Add year and month columns
attended_df['year'] = attended_df['a_date'].dt.year
attended_df['month'] = attended_df['a_date'].dt.month


# Calculate total hours per month for every clinician
attended_df['a_length_hours'] = attended_df['a_length'] / 60
monthly_hours = attended_df.groupby(['a_schedule', 'year', 'month'])['a_length_hours'].sum().reset_index()
monthly_hours.columns = ['Clinician', 'Year', 'Month', 'Total Hours']


# Determine active cases for every clinician (clients seen by that clinician in last 2 months)
now = datetime.now()
two_months_ago = now - timedelta(days=60)
recent_sessions = attended_df[attended_df['a_date'] >= two_months_ago]
# Only count a_centerclientid for a clinician if their last session with that client is within 2 months
last_seen = recent_sessions.groupby(['a_schedule', 'a_centerclientid'])['a_date'].max().reset_index()
active_cases = last_seen[last_seen['a_date'] >= two_months_ago].groupby('a_schedule')['a_centerclientid'].nunique().reset_index()
active_cases.columns = ['Clinician', 'Active Cases (last 2 months)']
print('\nActive cases for every clinician (last 2 months):')
print(active_cases)

# Find clinicians active in the last 3 months
three_months_ago = now - timedelta(days=90)
active_recent = attended_df[attended_df['a_date'] >= three_months_ago]
active_clinicians = set(active_recent['a_schedule'].unique())

# Filter monthly_hours and active_cases to only include active clinicians
monthly_hours_active = monthly_hours[monthly_hours['Clinician'].isin(active_clinicians)]
active_cases_active = active_cases[active_cases['Clinician'].isin(active_clinicians)]


# Pivot monthly_hours so each clinician is a row, columns are Year_Month, values are Total Hours
monthly_pivot = monthly_hours_active.pivot_table(index='Clinician', columns=['Year', 'Month'], values='Total Hours', fill_value=0)

monthly_pivot = monthly_pivot.reset_index()
monthly_pivot.columns = ['Clinician'] + [f"{col[0]}_{col[1]}" if isinstance(col, tuple) else str(col) for col in monthly_pivot.columns[1:]]

# Merge active cases into the pivot table
summary = monthly_pivot.merge(active_cases_active, on='Clinician', how='left')

# Save to CSV
summary.to_csv('clinician_summary.csv', index=False)
print('\nSummary saved to clinician_summary.csv')
