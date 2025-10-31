// Utility to fetch and parse clinician_summary.csv dynamically

import {
  getCurrentYear,
  getCurrentMonthIndex,
  getMonthLabelsUpToCurrent,
  getCurrentMonthColumn,
  getPreviousMonthColumn
} from './dateUtils.js';

// Clinician level mapping (hardcoded since this info isn't in CSV)
const clinicianLevels = {
  'Andrew Lim': 'junior',
  'Claudia Stefanie': 'senior',
  'Dominic Yeo': 'senior',
  'Haikel': 'lead',
  'John Leow': 'senior',
  'Kirsty Png': 'senior',
  'Leong Yee Teng Janice': 'junior',
  'Ng Xiao Hui': 'junior',
  'Oliver Tan': 'junior',
  'Seanna Neo': 'junior',
  'Soon Jiaying': 'senior',
  'Tan Siew Kei Joanna Ashley': 'lead'
};

// Display name mapping for shorter names
const displayNames = {
  'Leong Yee Teng Janice': 'Janice Leong',
  'Ng Xiao Hui': 'Xiao Hui',
  'Soon Jiaying': 'Jiaying',
  'Tan Siew Kei Joanna Ashley': 'Joanna Tan'
};

/**
 * Parse CSV text into an array of objects
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  console.log('CSV Headers:', headers);
  console.log('Active Cases column name:', headers[headers.length - 1]);

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    // Debug first row
    if (i === 1) {
      console.log('First row values count:', values.length);
      console.log('Headers count:', headers.length);
      console.log('Last value (active cases):', values[values.length - 1]);
    }

    data.push(row);
  }

  return data;
}

/**
 * Fetch and parse clinician_summary.csv
 */
export async function fetchClinicianData() {
  try {
    const response = await fetch('/clinician_summary.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }

    const csvText = await response.text();
    const parsedData = parseCSV(csvText);

    // Transform CSV data into the format expected by the app
    const cliniciansData = parsedData.map(row => {
      const fullName = row.Clinician;
      const displayName = displayNames[fullName] || fullName;
      const level = clinicianLevels[fullName] || 'junior';

      // Extract monthly hours dynamically based on current date
      const currentYear = getCurrentYear();
      const currentMonth = getCurrentMonthIndex() + 1; // 1-based month
      const monthlyHours2025 = [];

      for (let month = 1; month <= currentMonth; month++) {
        const columnName = `${currentYear}_${month}`;
        const hours = parseFloat(row[columnName]) || 0;
        monthlyHours2025.push(hours);
      }

      // Get recent hours (most recent month - dynamically calculated)
      const recentMonthColumn = getCurrentMonthColumn();
      const recentHours = parseFloat(row[recentMonthColumn]) || 0;

      // Get previous hours (dynamically calculated)
      const previousMonthColumn = getPreviousMonthColumn();
      const previousHours = parseFloat(row[previousMonthColumn]) || 0;

      // Get active cases
      const activeCasesRaw = row['Active Cases (last 2 months)'];
      const activeCases = parseInt(activeCasesRaw, 10);

      // Debug logging
      if (isNaN(activeCases)) {
        console.warn(`Failed to parse active cases for ${fullName}:`, activeCasesRaw);
      }

      return {
        name: displayName,
        fullName: fullName !== displayName ? fullName : undefined,
        level,
        recentHours,
        previousHours,
        activeCases: isNaN(activeCases) ? 0 : activeCases,
        monthlyHours2025
      };
    });

    console.log('Parsed clinicians data:', cliniciansData);
    return cliniciansData;
  } catch (error) {
    console.error('Error fetching clinician data:', error);
    throw error;
  }
}

export const levelLabels = {
  junior: 'Junior',
  senior: 'Senior',
  lead: 'Lead'
};

// Month labels - dynamically calculated based on current date
export const monthLabels = getMonthLabelsUpToCurrent();
