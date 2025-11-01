/**
 * Data validation utilities for robust error handling
 */

import { getCurrentMonthIndex, getCurrentYear } from './dateUtils.js';

/**
 * Validation error class for tracking validation issues
 */
export class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Validate that monthly hours array has expected structure
 * @param {Array<number>} monthlyHours - Array of monthly hours
 * @param {string} clinicianName - Name of clinician for error reporting
 * @returns {Object} Validation result with isValid and errors array
 */
export function validateMonthlyHours(monthlyHours, clinicianName = 'Unknown') {
  const errors = [];

  if (!Array.isArray(monthlyHours)) {
    errors.push({
      field: 'monthlyHours',
      message: `Monthly hours for ${clinicianName} is not an array`,
      value: typeof monthlyHours
    });
    return { isValid: false, errors };
  }

  const currentMonthIndex = getCurrentMonthIndex();
  const expectedLength = currentMonthIndex + 1; // 0-indexed, so add 1

  // Allow for CSV to be 1 month behind (common at start of new month)
  const minExpectedLength = Math.max(1, expectedLength - 1);

  if (monthlyHours.length < minExpectedLength) {
    errors.push({
      field: 'monthlyHours.length',
      message: `Monthly hours for ${clinicianName} has ${monthlyHours.length} months, expected at least ${minExpectedLength}`,
      value: monthlyHours.length
    });
  }

  // Check for non-numeric values
  monthlyHours.forEach((hours, index) => {
    if (typeof hours !== 'number' || isNaN(hours)) {
      errors.push({
        field: `monthlyHours[${index}]`,
        message: `Monthly hours for ${clinicianName} at index ${index} is not a valid number`,
        value: hours
      });
    }
    if (hours < 0) {
      errors.push({
        field: `monthlyHours[${index}]`,
        message: `Monthly hours for ${clinicianName} at index ${index} is negative`,
        value: hours
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate CSV structure has required columns
 * @param {Array<string>} headers - CSV header row
 * @returns {Object} Validation result with isValid and errors array
 */
export function validateCSVStructure(headers) {
  const errors = [];
  const requiredColumns = ['Clinician', 'Active Cases (last 2 months)'];

  // Check for required columns
  requiredColumns.forEach(column => {
    if (!headers.includes(column)) {
      errors.push({
        field: 'headers',
        message: `Missing required column: ${column}`,
        value: headers.join(', ')
      });
    }
  });

  // Check for monthly data columns (should have at least current or previous month)
  const currentYear = getCurrentYear();
  const currentMonthIndex = getCurrentMonthIndex();
  const currentMonthColumn = `${currentYear}_${currentMonthIndex + 1}`;
  const previousMonthColumn = currentMonthIndex > 0
    ? `${currentYear}_${currentMonthIndex}`
    : `${currentYear - 1}_12`;

  // Allow either current month or previous month to be present
  if (!headers.includes(currentMonthColumn) && !headers.includes(previousMonthColumn)) {
    errors.push({
      field: 'headers',
      message: `Missing recent month data columns: Expected ${currentMonthColumn} or ${previousMonthColumn}`,
      value: headers.join(', ')
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate a single CSV row has required data
 * @param {Object} row - Parsed CSV row object
 * @param {number} rowIndex - Row number for error reporting
 * @returns {Object} Validation result with isValid, errors array, and warnings array
 */
export function validateCSVRow(row, rowIndex) {
  const errors = [];
  const warnings = [];

  // Check for clinician name
  if (!row.Clinician || row.Clinician.trim() === '') {
    errors.push({
      field: 'Clinician',
      message: `Row ${rowIndex}: Missing clinician name`,
      value: row.Clinician
    });
  }

  // Check for active cases
  const activeCasesRaw = row['Active Cases (last 2 months)'];
  const activeCases = parseInt(activeCasesRaw, 10);

  if (activeCasesRaw === undefined || activeCasesRaw === null || activeCasesRaw === '') {
    warnings.push({
      field: 'Active Cases',
      message: `Row ${rowIndex} (${row.Clinician}): Missing active cases data, defaulting to 0`,
      value: activeCasesRaw
    });
  } else if (isNaN(activeCases)) {
    warnings.push({
      field: 'Active Cases',
      message: `Row ${rowIndex} (${row.Clinician}): Invalid active cases value, defaulting to 0`,
      value: activeCasesRaw
    });
  }

  // Check for at least some monthly data
  const currentYear = getCurrentYear();
  let hasAnyMonthlyData = false;

  for (let month = 1; month <= 12; month++) {
    const columnName = `${currentYear}_${month}`;
    if (row[columnName] !== undefined && row[columnName] !== '') {
      hasAnyMonthlyData = true;
      break;
    }
  }

  if (!hasAnyMonthlyData) {
    warnings.push({
      field: 'monthlyHours',
      message: `Row ${rowIndex} (${row.Clinician}): No monthly hours data found for ${currentYear}`,
      value: 'no data'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate array bounds for safe access
 * @param {Array} array - Array to validate
 * @param {number} index - Index to access
 * @param {*} defaultValue - Default value if out of bounds
 * @param {string} context - Context for error reporting
 * @returns {*} Value at index or default value
 */
export function safeArrayAccess(array, index, defaultValue = 0, context = '') {
  if (!Array.isArray(array)) {
    console.warn(`[${context}] Expected array but got ${typeof array}, returning default value`);
    return defaultValue;
  }

  if (index < 0 || index >= array.length) {
    console.warn(`[${context}] Index ${index} out of bounds for array of length ${array.length}, returning default value`);
    return defaultValue;
  }

  const value = array[index];

  if (typeof value !== 'number' || isNaN(value)) {
    console.warn(`[${context}] Value at index ${index} is not a valid number: ${value}, returning default value`);
    return defaultValue;
  }

  return value;
}

/**
 * Validate clinician name is in known list
 * @param {string} name - Clinician name
 * @param {Object} knownClinicians - Map of known clinician names
 * @returns {Object} Validation result
 */
export function validateClinicianName(name, knownClinicians) {
  const warnings = [];

  if (!knownClinicians[name]) {
    warnings.push({
      field: 'Clinician',
      message: `Unknown clinician: ${name}. This clinician may not appear in the system.`,
      value: name
    });
  }

  return {
    isValid: true, // Not a hard error, just a warning
    warnings
  };
}

/**
 * Safely calculate average from array with validation
 * @param {Array<number>} values - Array of numbers
 * @param {string} context - Context for error reporting
 * @returns {number} Average value or 0 if invalid
 */
export function safeAverage(values, context = '') {
  if (!Array.isArray(values) || values.length === 0) {
    console.warn(`[${context}] Cannot calculate average: invalid or empty array`);
    return 0;
  }

  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v) && v >= 0);

  if (validValues.length === 0) {
    console.warn(`[${context}] Cannot calculate average: no valid values in array`);
    return 0;
  }

  const sum = validValues.reduce((a, b) => a + b, 0);
  return sum / validValues.length;
}

/**
 * Validate and normalize a clinician data object
 * @param {Object} clinician - Raw clinician data
 * @returns {Object} Validation result with normalized data
 */
export function validateAndNormalizeClinicianData(clinician) {
  const errors = [];
  const warnings = [];

  // Ensure required fields exist
  const normalized = {
    name: clinician.name || 'Unknown',
    fullName: clinician.fullName,
    level: clinician.level || 'junior',
    recentHours: typeof clinician.recentHours === 'number' ? clinician.recentHours : 0,
    previousHours: typeof clinician.previousHours === 'number' ? clinician.previousHours : 0,
    activeCases: typeof clinician.activeCases === 'number' ? clinician.activeCases : 0,
    monthlyHours2025: Array.isArray(clinician.monthlyHours2025) ? clinician.monthlyHours2025 : []
  };

  // Validate monthly hours
  const monthlyHoursValidation = validateMonthlyHours(normalized.monthlyHours2025, normalized.name);
  if (!monthlyHoursValidation.isValid) {
    errors.push(...monthlyHoursValidation.errors);
  }

  // Add warnings for missing data
  if (normalized.activeCases === 0 && clinician.activeCases !== 0) {
    warnings.push({
      field: 'activeCases',
      message: `${normalized.name}: Invalid active cases value, defaulting to 0`,
      value: clinician.activeCases
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: normalized
  };
}
