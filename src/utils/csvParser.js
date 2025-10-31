// Utility to fetch and parse clinician_summary.csv dynamically

import {
  getCurrentYear,
  getCurrentMonthIndex,
  getMonthLabelsUpToCurrent,
  getCurrentMonthColumn,
  getPreviousMonthColumn
} from './dateUtils.js';

import {
  validateCSVStructure,
  validateCSVRow,
  validateClinicianName,
  validateAndNormalizeClinicianData
} from './dataValidation.js';

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
 * Parse CSV text into an array of objects with validation
 * @param {string} csvText - Raw CSV text
 * @returns {Object} Parsed data with validation results
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');

  // Handle empty CSV
  if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
    throw new Error('CSV file is empty');
  }

  const headers = lines[0].split(',').map(h => h.trim());

  console.log('CSV Headers:', headers);
  console.log('Active Cases column name:', headers[headers.length - 1]);

  // Validate CSV structure
  const structureValidation = validateCSVStructure(headers);
  if (!structureValidation.isValid) {
    const errorMessages = structureValidation.errors.map(e => e.message).join('; ');
    throw new Error(`CSV structure validation failed: ${errorMessages}`);
  }

  const data = [];
  const allWarnings = [];
  const allErrors = [];

  for (let i = 1; i < lines.length; i++) {
    // Skip empty lines
    if (!lines[i] || lines[i].trim() === '') {
      console.warn(`Skipping empty line at row ${i + 1}`);
      continue;
    }

    const values = lines[i].split(',').map(v => v.trim());
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || ''; // Default to empty string if undefined
    });

    // Validate row
    const rowValidation = validateCSVRow(row, i + 1);

    if (!rowValidation.isValid) {
      allErrors.push(...rowValidation.errors);
      console.error(`Row ${i + 1} validation failed:`, rowValidation.errors);
      // Skip invalid rows but continue processing
      continue;
    }

    if (rowValidation.warnings.length > 0) {
      allWarnings.push(...rowValidation.warnings);
      rowValidation.warnings.forEach(w => console.warn(w.message));
    }

    // Debug first row
    if (i === 1) {
      console.log('First row values count:', values.length);
      console.log('Headers count:', headers.length);
      console.log('Last value (active cases):', values[values.length - 1]);
    }

    data.push(row);
  }

  // Log summary
  console.log(`CSV parsing complete: ${data.length} valid rows, ${allErrors.length} errors, ${allWarnings.length} warnings`);

  return {
    data,
    warnings: allWarnings,
    errors: allErrors
  };
}

/**
 * Fetch and parse clinician_summary.csv with comprehensive validation
 */
export async function fetchClinicianData() {
  try {
    const response = await fetch('/clinician_summary.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();

    // Handle empty response
    if (!csvText || csvText.trim() === '') {
      throw new Error('CSV file is empty or could not be read');
    }

    const parseResult = parseCSV(csvText);
    const { data: parsedData, warnings, errors } = parseResult;

    // If there are critical errors and no data, throw
    if (parsedData.length === 0 && errors.length > 0) {
      throw new Error(`No valid data could be parsed. Errors: ${errors.map(e => e.message).join('; ')}`);
    }

    // Transform CSV data into the format expected by the app
    const cliniciansData = [];
    const transformWarnings = [];

    parsedData.forEach((row, index) => {
      try {
        const fullName = row.Clinician;
        const displayName = displayNames[fullName] || fullName;
        const level = clinicianLevels[fullName] || 'junior';

        // Validate clinician name is known
        const nameValidation = validateClinicianName(fullName, clinicianLevels);
        if (nameValidation.warnings.length > 0) {
          transformWarnings.push(...nameValidation.warnings);
        }

        // Extract monthly hours dynamically based on current date
        const currentYear = getCurrentYear();
        const currentMonth = getCurrentMonthIndex() + 1; // 1-based month
        const monthlyHours2025 = [];

        for (let month = 1; month <= currentMonth; month++) {
          const columnName = `${currentYear}_${month}`;
          const hoursRaw = row[columnName];
          const hours = parseFloat(hoursRaw);

          if (isNaN(hours) || hoursRaw === undefined || hoursRaw === '') {
            monthlyHours2025.push(0);
            if (hoursRaw !== '' && hoursRaw !== undefined) {
              console.warn(`Invalid hours value for ${fullName} in ${columnName}: ${hoursRaw}`);
            }
          } else if (hours < 0) {
            console.warn(`Negative hours value for ${fullName} in ${columnName}: ${hours}, using 0`);
            monthlyHours2025.push(0);
          } else {
            monthlyHours2025.push(hours);
          }
        }

        // Get recent hours (most recent month - dynamically calculated)
        const recentMonthColumn = getCurrentMonthColumn();
        const recentHoursRaw = parseFloat(row[recentMonthColumn]);
        const recentHours = isNaN(recentHoursRaw) || recentHoursRaw < 0 ? 0 : recentHoursRaw;

        // Get previous hours (dynamically calculated)
        const previousMonthColumn = getPreviousMonthColumn();
        const previousHoursRaw = parseFloat(row[previousMonthColumn]);
        const previousHours = isNaN(previousHoursRaw) || previousHoursRaw < 0 ? 0 : previousHoursRaw;

        // Get active cases
        const activeCasesRaw = row['Active Cases (last 2 months)'];
        const activeCases = parseInt(activeCasesRaw, 10);

        // Debug logging
        if (isNaN(activeCases)) {
          console.warn(`Failed to parse active cases for ${fullName}:`, activeCasesRaw);
        }

        const clinicianData = {
          name: displayName,
          fullName: fullName !== displayName ? fullName : undefined,
          level,
          recentHours,
          previousHours,
          activeCases: isNaN(activeCases) || activeCases < 0 ? 0 : activeCases,
          monthlyHours2025
        };

        // Final validation and normalization
        const validation = validateAndNormalizeClinicianData(clinicianData);

        if (validation.warnings.length > 0) {
          transformWarnings.push(...validation.warnings);
          validation.warnings.forEach(w => console.warn(w.message));
        }

        if (!validation.isValid) {
          console.error(`Skipping clinician ${fullName} due to validation errors:`, validation.errors);
          return;
        }

        cliniciansData.push(validation.data);
      } catch (rowError) {
        console.error(`Error processing row ${index + 1}:`, rowError);
        transformWarnings.push({
          field: 'row',
          message: `Failed to process row ${index + 1}: ${rowError.message}`,
          value: row.Clinician || 'Unknown'
        });
      }
    });

    // Log final summary
    console.log(`Parsed ${cliniciansData.length} clinicians successfully`);
    if (transformWarnings.length > 0) {
      console.warn(`${transformWarnings.length} warnings during data transformation`);
    }

    console.log('Parsed clinicians data:', cliniciansData);
    return cliniciansData;
  } catch (error) {
    console.error('Error fetching clinician data:', error);
    throw new Error(`Failed to load clinician data: ${error.message}`);
  }
}

export const levelLabels = {
  junior: 'Junior',
  senior: 'Senior',
  lead: 'Lead'
};

// Month labels - dynamically calculated based on current date
export const monthLabels = getMonthLabelsUpToCurrent();
