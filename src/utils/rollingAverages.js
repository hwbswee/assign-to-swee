/**
 * Calculate rolling averages for clinicians
 * Provides a more stable view of assignment over sustained periods
 */

import { getCurrentMonthIndex, getGrowthComparisonIndices } from './dateUtils.js';

/**
 * Calculate 3-month rolling average
 * @param {Array<number>} monthlyHours - Array of monthly hours
 * @param {number} endIndex - End index (inclusive) for the average
 * @returns {number} Average of 3 months ending at endIndex
 */
export function calculateRollingAverage(monthlyHours, endIndex) {
  if (endIndex < 2) {
    // Not enough data for 3-month average, use available data
    const availableData = monthlyHours.slice(0, endIndex + 1);
    const sum = availableData.reduce((a, b) => a + b, 0);
    return availableData.length > 0 ? sum / availableData.length : 0;
  }

  const startIndex = endIndex - 2; // 3 months: endIndex-2, endIndex-1, endIndex
  const threeMonths = monthlyHours.slice(startIndex, endIndex + 1);
  const sum = threeMonths.reduce((a, b) => a + b, 0);
  return sum / 3;
}

/**
 * Add rolling average fields to clinician data
 * Recent and previous periods calculated dynamically based on current date
 */
export function enrichWithRollingAverages(cliniciansData) {
  const currentMonthIndex = getCurrentMonthIndex();
  const { recent, previous } = getGrowthComparisonIndices(3);

  return cliniciansData.map(clinician => {
    // Recent 3 months average (ending at current month)
    const recentAvg = calculateRollingAverage(clinician.monthlyHours2025, currentMonthIndex);

    // Previous 3 months average (ending 3 months before current)
    const previousEndIndex = previous.endIndex - 1; // -1 because endIndex is exclusive in slice
    const previousAvg = calculateRollingAverage(clinician.monthlyHours2025, previousEndIndex);

    return {
      ...clinician,
      recentAverage: Number(recentAvg.toFixed(1)),
      previousAverage: Number(previousAvg.toFixed(1))
    };
  });
}
