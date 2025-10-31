/**
 * Calculate weighted assignment score for clinicians
 * Lower score = better candidate for assignment (less assignment)
 *
 * FAIR SCORING FORMULA:
 * - Active Cases: 30% (current caseload reality)
 * - Current Month: 30% (what's happening RIGHT NOW)
 * - 6-Month Average: 30% (sustained pattern - dynamically calculated)
 * - Growth Rate: 10% (current month vs their own historical baseline - individualized fairness)
 *
 * NOTE: Normalized across ALL clinicians (not just within level)
 * This ensures leads with 2 cases score lower than juniors with 25 cases
 */

export function calculateAssignmentScore(clinician, allClinicians, baselineMaxActiveCases = null) {
  // Find max values for normalization ACROSS ALL CLINICIANS
  // This makes scores comparable across levels
  // Use baselineMaxActiveCases if provided (for time window adjustments)
  const maxActiveCases = baselineMaxActiveCases !== null
    ? baselineMaxActiveCases
    : Math.max(...allClinicians.map(c => c.activeCases), 1);
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
  const baseScore = (
    normalizedActiveCases * 0.30 +    // 30% weight
    normalizedCurrentMonth * 0.30 +    // 30% weight
    normalizedSixMonthAvg * 0.30 +     // 30% weight
    normalizedGrowthRate * 0.10        // 10% weight
  ) * 100;

  // Apply protection penalties (if detected)
  const burnoutPenalty = clinician.burnout ? clinician.burnout.penalty : 0;
  const loadBalancingPenalty = clinician.loadBalancing ? clinician.loadBalancing.penalty : 0;
  const finalScore = baseScore + burnoutPenalty + loadBalancingPenalty;

  return Math.round(Math.min(finalScore, 100)); // Cap at 100
}

export function getRecommendationLevel(score) {
  if (score <= 40) return 'high';
  if (score <= 70) return 'medium';
  return 'low';
}

export function sortByAssignmentScore(clinicians) {
  return [...clinicians].sort((a, b) => a.assignmentScore - b.assignmentScore);
}
