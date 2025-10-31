/**
 * Advanced assignment metrics for fair assignment scoring
 *
 * Fair Formula:
 * - Active Cases: 30% (current caseload reality)
 * - Current Month: 30% (what's happening RIGHT NOW)
 * - 6-Month Trend: 30% (sustained pattern)
 * - Growth Rate: 10% (current month vs individual historical baseline - individualized fairness)
 * - Burnout Protection: +5 to +15 points for consecutive high-load months
 * - Load Balancing Protection: +3 to +10 points for consecutive months at 1.5+ SD above mean
 */

import { getLastNMonthsIndices, getCurrentMonthIndex } from './dateUtils.js';
import { detectBurnout } from './burnoutDetection.js';
import { detectLoadBalancing } from './loadBalancingProtection.js';

/**
 * Calculate 6-month average (dynamically calculated from current date)
 * @param {Array<number>} monthlyHours - Array of monthly hours
 * @returns {number} Average of last 6 months
 */
export function calculate6MonthAverage(monthlyHours) {
  const { startIndex, endIndex } = getLastNMonthsIndices(6);
  const last6Months = monthlyHours.slice(startIndex, endIndex);
  const sum = last6Months.reduce((a, b) => a + b, 0);
  return last6Months.length > 0 ? sum / last6Months.length : 0;
}

/**
 * Calculate growth rate: compare current month against individual historical baseline
 * This is fairer as each clinician is compared to their own typical pattern
 * Positive = assignment increasing vs their baseline, Negative = assignment decreasing
 * @param {Array<number>} monthlyHours - Array of monthly hours
 * @param {number} currentMonthIndex - Current month index (0-based)
 * @returns {number} Growth rate as percentage
 */
export function calculateGrowthRate(monthlyHours, currentMonthIndex) {
  // Current month value
  const currentMonth = monthlyHours[currentMonthIndex] || 0;

  // Historical average: last 6 months EXCLUDING current month
  // This gives a stable baseline of their typical pattern
  const historicalStartIndex = Math.max(0, currentMonthIndex - 6);
  const historicalEndIndex = currentMonthIndex; // Exclusive of current month

  const historicalMonths = monthlyHours.slice(historicalStartIndex, historicalEndIndex);
  const historicalAvg = historicalMonths.length > 0
    ? historicalMonths.reduce((a, b) => a + b, 0) / historicalMonths.length
    : 0;

  // If no historical data, check if current month has data
  if (historicalAvg === 0) {
    return currentMonth > 0 ? 100 : 0; // New clinician with first month of data
  }

  // Calculate how current month compares to their individual baseline
  // Positive = higher than typical (busier), Negative = lower than typical (more available)
  const growthRate = ((currentMonth - historicalAvg) / historicalAvg) * 100;
  return growthRate;
}

/**
 * Enrich clinician data with all assignment metrics
 */
export function enrichWithAssignmentMetrics(cliniciansData) {
  const currentMonthIndex = getCurrentMonthIndex();

  // First pass: calculate individual metrics
  const enrichedData = cliniciansData.map(clinician => {
    const monthlyHours = clinician.monthlyHours2025;

    // Current month (dynamically calculated)
    const currentMonth = monthlyHours[currentMonthIndex] || 0;

    // 6-month average (dynamically calculated)
    const sixMonthAvg = calculate6MonthAverage(monthlyHours);

    // Growth rate (current month vs individual historical baseline - dynamically calculated)
    const growthRate = calculateGrowthRate(monthlyHours, currentMonthIndex);

    // Burnout detection (consecutive high-load months)
    const burnoutInfo = detectBurnout(monthlyHours, currentMonthIndex);

    return {
      ...clinician,
      currentMonth: Number(currentMonth.toFixed(1)),
      sixMonthAverage: Number(sixMonthAvg.toFixed(1)),
      growthRate: Number(growthRate.toFixed(1)),
      burnout: burnoutInfo
    };
  });

  // Second pass: detect load balancing needs (requires all clinicians for ranking)
  return enrichedData.map(clinician => {
    const loadBalancingInfo = detectLoadBalancing(
      clinician.monthlyHours2025,
      enrichedData,
      currentMonthIndex
    );

    return {
      ...clinician,
      loadBalancing: loadBalancingInfo
    };
  });
}
