/**
 * Calculate rolling averages for clinicians
 * Provides a more stable view of workload over sustained periods
 */

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
 * Recent: Average of last 3 months (Aug, Sep, Oct 2025) - indices 7, 8, 9
 * Previous: Average of 3 months before (May, Jun, Jul 2025) - indices 4, 5, 6
 */
export function enrichWithRollingAverages(cliniciansData) {
  return cliniciansData.map(clinician => {
    const recentAvg = calculateRollingAverage(clinician.monthlyHours2025, 9); // Oct is index 9
    const previousAvg = calculateRollingAverage(clinician.monthlyHours2025, 6); // Jul is index 6

    return {
      ...clinician,
      recentAverage: Number(recentAvg.toFixed(1)),
      previousAverage: Number(previousAvg.toFixed(1))
    };
  });
}
