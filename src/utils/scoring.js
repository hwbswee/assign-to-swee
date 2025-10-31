/**
 * Calculate weighted assignment score for clinicians
 * Lower score = better candidate for assignment (less workload)
 *
 * FAIR SCORING FORMULA:
 * - Active Cases: 40% (current caseload reality - most important)
 * - Current Month: 25% (what's happening RIGHT NOW - October 2025)
 * - 6-Month Average: 25% (sustained pattern - May to October 2025)
 * - Growth Rate: 10% (workload trajectory - increasing or decreasing)
 *
 * NOTE: Normalized across ALL clinicians (not just within level)
 * This ensures leads with 2 cases score lower than juniors with 25 cases
 */

export function calculateAssignmentScore(clinician, allClinicians) {
  // Find max values for normalization ACROSS ALL CLINICIANS
  // This makes scores comparable across levels
  const maxActiveCases = Math.max(...allClinicians.map(c => c.activeCases), 1);
  const maxCurrentMonth = Math.max(...allClinicians.map(c => c.currentMonth), 1);
  const maxSixMonthAvg = Math.max(...allClinicians.map(c => c.sixMonthAverage), 1);

  // For growth rate, we need to handle both positive and negative values
  const growthRates = allClinicians.map(c => c.growthRate);
  const maxGrowthRate = Math.max(...growthRates);
  const minGrowthRate = Math.min(...growthRates);
  const growthRateRange = maxGrowthRate - minGrowthRate;

  // Normalize values (0-1 scale)
  const normalizedActiveCases = clinician.activeCases / maxActiveCases;
  const normalizedCurrentMonth = clinician.currentMonth / maxCurrentMonth;
  const normalizedSixMonthAvg = clinician.sixMonthAverage / maxSixMonthAvg;

  // Normalize growth rate: higher growth = worse for assignment
  // Map growth rate to 0-1 scale where higher growth = higher score
  const normalizedGrowthRate = growthRateRange > 0
    ? (clinician.growthRate - minGrowthRate) / growthRateRange
    : 0;

  // Weighted score (lower is better for assignment)
  const score = (
    normalizedActiveCases * 0.40 +    // 40% weight
    normalizedCurrentMonth * 0.25 +    // 25% weight
    normalizedSixMonthAvg * 0.25 +     // 25% weight
    normalizedGrowthRate * 0.10        // 10% weight
  ) * 100;

  return Math.round(score);
}

export function getRecommendationLevel(score) {
  if (score <= 40) return 'high';
  if (score <= 70) return 'medium';
  return 'low';
}

export function sortByAssignmentScore(clinicians) {
  return [...clinicians].sort((a, b) => a.assignmentScore - b.assignmentScore);
}
