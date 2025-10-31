/**
 * Load Balancing Protection
 * Protects clinicians who are consistently 1.5 standard deviations above mean hours
 * Uses statistical analysis to objectively identify high-load patterns
 */

/**
 * Calculate mean and standard deviation for an array of numbers
 */
function calculateStats(values) {
  const validValues = values.filter(v => v > 0);
  if (validValues.length === 0) {
    return { mean: 0, stdDev: 0 };
  }

  const mean = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;

  const squaredDiffs = validValues.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / validValues.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}

/**
 * Detect if clinician consistently carries high load (1.5 SD above mean)
 * @param {Array<number>} monthlyHours - This clinician's monthly hours
 * @param {Array<Object>} allClinicians - All clinicians data
 * @param {number} currentMonthIndex - Current month index (0-based)
 * @returns {Object} Load balancing analysis with penalty and level
 */
export function detectLoadBalancing(monthlyHours, allClinicians, currentMonthIndex) {
  // Need at least 2 months of data to detect patterns
  if (currentMonthIndex < 1) {
    return { consecutiveHighLoadMonths: 0, protectionLevel: 'none', penalty: 0 };
  }

  // Check how many consecutive months (from current backwards) this person was 1.5 SD above mean
  let consecutiveCount = 0;
  const SD_THRESHOLD = 1.5; // Standard deviations above mean

  for (let monthIdx = currentMonthIndex; monthIdx >= 0; monthIdx--) {
    // Get all clinicians' hours for this month
    const monthlyHoursForAll = allClinicians
      .map(c => c.monthlyHours2025[monthIdx] || 0)
      .filter(h => h > 0); // Only include those with hours

    // Calculate mean and standard deviation
    const { mean, stdDev } = calculateStats(monthlyHoursForAll);

    // Calculate threshold: mean + 1.5 * standard deviation
    const threshold = mean + (SD_THRESHOLD * stdDev);

    // Check if this clinician exceeds threshold
    const thisClinicianHours = monthlyHours[monthIdx] || 0;

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
