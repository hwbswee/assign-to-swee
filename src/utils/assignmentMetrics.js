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
import { safeArrayAccess, safeAverage } from './dataValidation.js';

/**
 * Calculate 6-month average (dynamically calculated from current date)
 * @param {Array<number>} monthlyHours - Array of monthly hours
 * @returns {number} Average of last 6 months
 */
export function calculate6MonthAverage(monthlyHours) {
  if (!Array.isArray(monthlyHours)) {
    console.warn('[calculate6MonthAverage] Invalid monthlyHours: not an array');
    return 0;
  }

  const { startIndex, endIndex } = getLastNMonthsIndices(6);

  // Ensure we don't slice beyond array bounds
  const safeEndIndex = Math.min(endIndex, monthlyHours.length);
  const safeStartIndex = Math.min(startIndex, monthlyHours.length);

  if (safeStartIndex >= safeEndIndex) {
    console.warn('[calculate6MonthAverage] Invalid date range or insufficient data');
    return 0;
  }

  const last6Months = monthlyHours.slice(safeStartIndex, safeEndIndex);
  return safeAverage(last6Months, 'calculate6MonthAverage');
}

/**
 * Calculate growth rate: compare current month against individual historical baseline
 * This is fairer as each clinician is compared to their own typical pattern
 * Positive = assignment increasing vs their baseline, Negative = assignment decreasing
 * @param {Array<number>} monthlyHours - Array of monthly hours
 * @param {number} currentMonthIndex - Current month index (0-based)
 * @param {number} effectiveMonthIndex - Effective month index to use (for fallback scenarios)
 * @returns {number} Growth rate as percentage
 */
export function calculateGrowthRate(monthlyHours, currentMonthIndex, effectiveMonthIndex = null) {
  if (!Array.isArray(monthlyHours)) {
    console.warn('[calculateGrowthRate] Invalid monthlyHours: not an array');
    return 0;
  }

  // Use effective month index if provided (for fallback scenarios)
  const monthIndexToUse = effectiveMonthIndex !== null ? effectiveMonthIndex : currentMonthIndex;

  // Current month value with bounds checking
  const currentMonth = safeArrayAccess(
    monthlyHours,
    monthIndexToUse,
    0,
    'calculateGrowthRate:currentMonth'
  );

  // Historical average: last 6 months EXCLUDING the month we're using
  // This gives a stable baseline of their typical pattern
  const historicalStartIndex = Math.max(0, monthIndexToUse - 6);
  const historicalEndIndex = monthIndexToUse; // Exclusive of the month being compared

  // Ensure we don't slice beyond array bounds
  const safeEndIndex = Math.min(historicalEndIndex, monthlyHours.length);
  const safeStartIndex = Math.min(historicalStartIndex, monthlyHours.length);

  if (safeStartIndex >= safeEndIndex) {
    // No historical data available
    return currentMonth > 0 ? 100 : 0; // New clinician with first month of data
  }

  const historicalMonths = monthlyHours.slice(safeStartIndex, safeEndIndex);
  const historicalAvg = safeAverage(historicalMonths, 'calculateGrowthRate:historical');

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
  if (!Array.isArray(cliniciansData) || cliniciansData.length === 0) {
    console.warn('[enrichWithAssignmentMetrics] Invalid or empty cliniciansData');
    return [];
  }

  const currentMonthIndex = getCurrentMonthIndex();

  // Smart fallback logic: use previous month data if we're early in the month
  const dayOfMonth = new Date().getDate();
  const isEarlyInMonth = dayOfMonth <= 7;

  // First pass: calculate individual metrics
  const enrichedData = cliniciansData.map(clinician => {
    try {
      const monthlyHours = clinician.monthlyHours2025;

      if (!Array.isArray(monthlyHours)) {
        console.error(`[enrichWithAssignmentMetrics] Invalid monthlyHours for ${clinician.name}`);
        return {
          ...clinician,
          currentMonth: 0,
          sixMonthAverage: 0,
          growthRate: 0,
          burnout: { burnoutLevel: 'none', consecutiveMonths: 0, penalty: 0 },
          usingPreviousMonthFallback: false
        };
      }

      // Current month (dynamically calculated) with bounds checking
      const currentMonthRaw = safeArrayAccess(
        monthlyHours,
        currentMonthIndex,
        0,
        `enrichWithAssignmentMetrics:${clinician.name}:currentMonth`
      );

      // Smart fallback: use previous month if we're early in the month and current is low/empty
      const isCurrentMonthEmpty = currentMonthRaw < 5;
      const useFallback = isEarlyInMonth && isCurrentMonthEmpty;

      const currentMonth = useFallback
        ? safeArrayAccess(
            monthlyHours,
            currentMonthIndex - 1,
            0,
            `enrichWithAssignmentMetrics:${clinician.name}:previousMonth`
          )
        : currentMonthRaw;

      if (useFallback) {
        console.log(`[Smart Fallback] Using previous month data for ${clinician.name} (current: ${currentMonthRaw}h, previous: ${currentMonth}h)`);
      }

      // 6-month average (dynamically calculated)
      const sixMonthAvg = calculate6MonthAverage(monthlyHours);

      // Growth rate (current month vs individual historical baseline - dynamically calculated)
      // If using fallback, compare previous month to its own historical baseline
      const effectiveMonthIndex = useFallback ? currentMonthIndex - 1 : currentMonthIndex;
      const growthRate = calculateGrowthRate(monthlyHours, currentMonthIndex, effectiveMonthIndex);

      // Burnout detection (consecutive high-load months)
      const burnoutInfo = detectBurnout(monthlyHours, currentMonthIndex);

      return {
        ...clinician,
        currentMonth: Number(currentMonth.toFixed(1)),
        sixMonthAverage: Number(sixMonthAvg.toFixed(1)),
        growthRate: Number(growthRate.toFixed(1)),
        burnout: burnoutInfo,
        usingPreviousMonthFallback: useFallback
      };
    } catch (error) {
      console.error(`[enrichWithAssignmentMetrics] Error processing ${clinician.name}:`, error);
      return {
        ...clinician,
        currentMonth: 0,
        sixMonthAverage: 0,
        growthRate: 0,
        burnout: { burnoutLevel: 'none', consecutiveMonths: 0, penalty: 0 },
        usingPreviousMonthFallback: false
      };
    }
  });

  // Second pass: detect load balancing needs (requires all clinicians for ranking)
  return enrichedData.map(clinician => {
    try {
      const loadBalancingInfo = detectLoadBalancing(
        clinician.monthlyHours2025,
        enrichedData,
        currentMonthIndex
      );

      return {
        ...clinician,
        loadBalancing: loadBalancingInfo
      };
    } catch (error) {
      console.error(`[enrichWithAssignmentMetrics] Error in load balancing for ${clinician.name}:`, error);
      return {
        ...clinician,
        loadBalancing: { isOutlier: false, consecutiveMonths: 0, penalty: 0 }
      };
    }
  });
}
