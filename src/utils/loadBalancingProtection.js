/**
 * Load Balancing Protection
 * Protects clinicians who are consistently 1.5 standard deviations above mean hours
 * Uses statistical analysis to objectively identify high-load patterns
 */

import { safeArrayAccess, safeAverage } from './dataValidation.js';

/**
 * Calculate mean and standard deviation for an array of numbers
 */
function calculateStats(values) {
  if (!Array.isArray(values)) {
    console.warn('[calculateStats] Invalid values: not an array');
    return { mean: 0, stdDev: 0, count: 0 };
  }

  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v) && v > 0);

  if (validValues.length === 0) {
    return { mean: 0, stdDev: 0, count: 0 };
  }

  // Warn if sample size is too small for reliable statistics
  if (validValues.length < 3) {
    console.warn(`[calculateStats] Small sample size (${validValues.length}), statistics may be unreliable`);
  }

  const mean = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;

  const squaredDiffs = validValues.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / validValues.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev, count: validValues.length };
}

/**
 * Detect if clinician consistently carries high load (1.5 SD above mean)
 * @param {Array<number>} monthlyHours - This clinician's monthly hours
 * @param {Array<Object>} allClinicians - All clinicians data
 * @param {number} currentMonthIndex - Current month index (0-based)
 * @returns {Object} Load balancing analysis with penalty and level
 */
export function detectLoadBalancing(monthlyHours, allClinicians, currentMonthIndex) {
  // Validate inputs
  if (!Array.isArray(monthlyHours)) {
    console.warn('[detectLoadBalancing] Invalid monthlyHours: not an array');
    return { consecutiveHighLoadMonths: 0, protectionLevel: 'none', penalty: 0 };
  }

  if (!Array.isArray(allClinicians)) {
    console.warn('[detectLoadBalancing] Invalid allClinicians: not an array');
    return { consecutiveHighLoadMonths: 0, protectionLevel: 'none', penalty: 0 };
  }

  if (currentMonthIndex < 0 || currentMonthIndex >= monthlyHours.length) {
    console.warn(`[detectLoadBalancing] Invalid currentMonthIndex: ${currentMonthIndex} for array length ${monthlyHours.length}`);
    return { consecutiveHighLoadMonths: 0, protectionLevel: 'none', penalty: 0 };
  }

  // Need at least 2 months of data to detect patterns
  if (currentMonthIndex < 1) {
    return { consecutiveHighLoadMonths: 0, protectionLevel: 'none', penalty: 0 };
  }

  // Minimum population size for reliable statistics
  const MIN_POPULATION = 3;

  // Check how many consecutive months (from current backwards) this person was 1.5 SD above mean
  let consecutiveCount = 0;
  const SD_THRESHOLD = 1.5; // Standard deviations above mean

  for (let monthIdx = currentMonthIndex; monthIdx >= 0; monthIdx--) {
    // Get all clinicians' hours for this month with bounds checking
    const monthlyHoursForAll = allClinicians
      .map(c => {
        if (!c || !Array.isArray(c.monthlyHours2025)) {
          return 0;
        }
        return safeArrayAccess(c.monthlyHours2025, monthIdx, 0, `loadBalancing:${c.name || 'unknown'}:month${monthIdx}`);
      })
      .filter(h => h > 0); // Only include those with hours

    // Skip months with insufficient population for statistics
    if (monthlyHoursForAll.length < MIN_POPULATION) {
      console.warn(`[detectLoadBalancing] Month ${monthIdx}: insufficient population (${monthlyHoursForAll.length}), skipping statistical analysis`);
      break; // Stop checking if population too small
    }

    // Calculate mean and standard deviation
    const { mean, stdDev, count } = calculateStats(monthlyHoursForAll);

    // If stdDev is 0, everyone has the same hours - can't determine outliers
    if (stdDev === 0) {
      console.warn(`[detectLoadBalancing] Month ${monthIdx}: zero standard deviation, cannot detect outliers`);
      break;
    }

    // Calculate threshold: mean + 1.5 * standard deviation
    const threshold = mean + (SD_THRESHOLD * stdDev);

    // Check if this clinician exceeds threshold with bounds checking
    const thisClinicianHours = safeArrayAccess(
      monthlyHours,
      monthIdx,
      0,
      'detectLoadBalancing:thisClinicianHours'
    );

    if (thisClinicianHours > 0 && thisClinicianHours >= threshold) {
      consecutiveCount++;
    } else {
      break; // Stop at first month below threshold
    }
  }

  // Determine protection level and penalty (more gentle)
  let protectionLevel = 'none';
  let penalty = 0;

  if (consecutiveCount >= 4) {
    protectionLevel = 'high';      // High Protection
    penalty = 10;
  } else if (consecutiveCount === 3) {
    protectionLevel = 'moderate';  // Moderate Protection
    penalty = 6;
  } else if (consecutiveCount === 2) {
    protectionLevel = 'low';       // Low Protection
    penalty = 3;
  }

  return {
    consecutiveHighLoadMonths: consecutiveCount,
    protectionLevel,
    penalty
  };
}

/**
 * Get user-friendly label for protection level
 */
export function getProtectionLabel(protectionLevel) {
  const labels = {
    'none': null,
    'low': 'Load Balancing Protection',
    'moderate': 'Load Balancing Protection',
    'high': 'Load Balancing Protection'
  };
  return labels[protectionLevel];
}

/**
 * Get detailed description
 */
export function getProtectionDescription(consecutiveHighLoadMonths, penalty) {
  return `${consecutiveHighLoadMonths} consecutive months at 1.5+ SD above mean hours (Protection: +${penalty} pts)`;
}
