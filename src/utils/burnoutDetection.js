/**
 * Burnout detection for clinicians
 * Protects against consecutive high-load months (B2B overwork)
 */

import { safeArrayAccess, safeAverage } from './dataValidation.js';

/**
 * Detect consecutive high-load months and calculate burnout risk
 * @param {Array<number>} monthlyHours - Array of monthly hours for current year
 * @param {number} currentMonthIndex - Current month index (0-based)
 * @returns {Object} Burnout analysis with penalty and level
 */
export function detectBurnout(monthlyHours, currentMonthIndex) {
  // Validate inputs
  if (!Array.isArray(monthlyHours)) {
    console.warn('[detectBurnout] Invalid monthlyHours: not an array');
    return { consecutiveHighMonths: 0, burnoutLevel: 'none', penalty: 0, threshold: 0 };
  }

  if (currentMonthIndex < 0 || currentMonthIndex >= monthlyHours.length) {
    console.warn(`[detectBurnout] Invalid currentMonthIndex: ${currentMonthIndex} for array length ${monthlyHours.length}`);
    return { consecutiveHighMonths: 0, burnoutLevel: 'none', penalty: 0, threshold: 0 };
  }

  // Need at least 3 months of data to detect patterns
  if (currentMonthIndex < 2) {
    return { consecutiveHighMonths: 0, burnoutLevel: 'none', penalty: 0, threshold: 0 };
  }

  // Calculate individual baseline (average of all their months)
  // Ensure we don't exceed array bounds
  const safeEndIndex = Math.min(currentMonthIndex + 1, monthlyHours.length);
  const monthsToCheck = monthlyHours.slice(0, safeEndIndex);
  const validMonths = monthsToCheck.filter(h => typeof h === 'number' && !isNaN(h) && h > 0);

  if (validMonths.length === 0) {
    return { consecutiveHighMonths: 0, burnoutLevel: 'none', penalty: 0, threshold: 0 };
  }

  const average = safeAverage(validMonths, 'detectBurnout:baseline');

  if (average === 0) {
    return { consecutiveHighMonths: 0, burnoutLevel: 'none', penalty: 0, threshold: 0 };
  }

  // High-load threshold: individual average + 25%, capped at 45 hours
  // This accounts for both high performers and protects against absolute burnout
  const highLoadThreshold = Math.min(average * 1.25, 45);

  // Count consecutive high-load months working backwards from current
  let consecutiveCount = 0;
  for (let i = currentMonthIndex; i >= 0; i--) {
    const hours = safeArrayAccess(monthlyHours, i, 0, 'detectBurnout:consecutiveCheck');
    if (hours >= highLoadThreshold) {
      consecutiveCount++;
    } else {
      break; // Stop at first non-high month
    }
  }

  // Determine burnout level and penalty
  let burnoutLevel = 'none';
  let penalty = 0;

  if (consecutiveCount >= 4) {
    burnoutLevel = 'severe';   // 🔴 Burnout Risk
    penalty = 15;
  } else if (consecutiveCount === 3) {
    burnoutLevel = 'warning';  // 🟠 Warning
    penalty = 10;
  } else if (consecutiveCount === 2) {
    burnoutLevel = 'caution';  // 🟡 Caution
    penalty = 3;
  }

  return {
    consecutiveHighMonths: consecutiveCount,
    burnoutLevel,
    penalty,
    threshold: Math.round(highLoadThreshold * 10) / 10
  };
}

/**
 * Get user-friendly label for burnout status
 */
export function getBurnoutLabel(burnoutLevel) {
  const labels = {
    'none': null,
    'caution': '🟡 Caution',
    'warning': '🟠 Warning',
    'severe': '🔴 Burnout Risk'
  };
  return labels[burnoutLevel];
}
