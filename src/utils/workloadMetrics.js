/**
 * Advanced workload metrics for fair assignment scoring
 *
 * New Fair Formula:
 * - Active Cases: 40% (current caseload reality)
 * - Current Month: 25% (what's happening RIGHT NOW)
 * - 6-Month Trend: 25% (sustained pattern)
 * - Growth Rate: 10% (trajectory - increasing or decreasing workload)
 */

/**
 * Calculate 6-month average
 * @param {Array<number>} monthlyHours - Array of monthly hours
 * @returns {number} Average of last 6 months (May-Oct 2025)
 */
export function calculate6MonthAverage(monthlyHours) {
  // Indices 4-9: May, Jun, Jul, Aug, Sep, Oct
  const last6Months = monthlyHours.slice(4, 10);
  const sum = last6Months.reduce((a, b) => a + b, 0);
  return last6Months.length > 0 ? sum / last6Months.length : 0;
}

/**
 * Calculate growth rate: comparing recent trend vs previous trend
 * Positive = workload increasing, Negative = workload decreasing
 * @param {Array<number>} monthlyHours - Array of monthly hours
 * @returns {number} Growth rate as percentage
 */
export function calculateGrowthRate(monthlyHours) {
  // Recent 3 months: Aug, Sep, Oct (indices 7, 8, 9)
  const recent3Months = monthlyHours.slice(7, 10);
  const recentAvg = recent3Months.reduce((a, b) => a + b, 0) / 3;

  // Previous 3 months: May, Jun, Jul (indices 4, 5, 6)
  const previous3Months = monthlyHours.slice(4, 7);
  const previousAvg = previous3Months.reduce((a, b) => a + b, 0) / 3;

  // Calculate growth rate
  if (previousAvg === 0) {
    return recentAvg > 0 ? 100 : 0; // If no previous data but have recent, 100% growth
  }

  const growthRate = ((recentAvg - previousAvg) / previousAvg) * 100;
  return growthRate;
}

/**
 * Enrich clinician data with all workload metrics
 */
export function enrichWithWorkloadMetrics(cliniciansData) {
  return cliniciansData.map(clinician => {
    const monthlyHours = clinician.monthlyHours2025;

    // Current month (October 2025 - index 9)
    const currentMonth = monthlyHours[9];

    // 6-month average (May-Oct 2025)
    const sixMonthAvg = calculate6MonthAverage(monthlyHours);

    // Growth rate (recent vs previous 3 months)
    const growthRate = calculateGrowthRate(monthlyHours);

    return {
      ...clinician,
      currentMonth: Number(currentMonth.toFixed(1)),
      sixMonthAverage: Number(sixMonthAvg.toFixed(1)),
      growthRate: Number(growthRate.toFixed(1))
    };
  });
}
