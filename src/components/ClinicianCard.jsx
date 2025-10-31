import React from 'react';

const ClinicianCard = ({ clinician, rank }) => {
  const { name, level, currentMonth, sixMonthAverage, growthRate, activeCases, assignmentScore, recommendationLevel, burnout, loadBalancing } = clinician;

  const getGrowthIndicator = () => {
    if (growthRate > 10) return { text: '↑ Growing', class: 'growth-up' };
    if (growthRate < -10) return { text: '↓ Declining', class: 'growth-down' };
    return { text: '→ Stable', class: 'growth-stable' };
  };

  const growth = getGrowthIndicator();

  const getRecommendationBadge = () => {
    if (recommendationLevel === 'high') {
      return <span className="recommendation-badge high">Highly Recommended</span>;
    } else if (recommendationLevel === 'medium') {
      return <span className="recommendation-badge medium">Recommended</span>;
    } else {
      return <span className="recommendation-badge low">Consider Others First</span>;
    }
  };

  return (
    <div className={`clinician-card recommendation-${recommendationLevel}`}>
      <div className="card-header">
        <div className="rank-badge">#{rank}</div>
        <div className="clinician-info">
          <h3 className="clinician-name">{name}</h3>
          <span className="clinician-level">{level}</span>
        </div>
        {getRecommendationBadge()}
      </div>

      <div className="card-body">
        <div className="stat-grid">
          <div className="stat-item" title="Current caseload: Clients seen in last 2 months (30% weight)">
            <span className="stat-label">Active Cases</span>
            <span className="stat-value">{activeCases}</span>
          </div>
          <div className="stat-item" title="Current month clinical hours (30% weight)">
            <span className="stat-label">Current Month</span>
            <span className="stat-value">{currentMonth}h</span>
          </div>
          <div className="stat-item" title="6-month average hours (30% weight)">
            <span className="stat-label">6-Month Avg</span>
            <span className="stat-value">{sixMonthAverage}h</span>
          </div>
          <div className="stat-item" title={`Current month vs their historical average: ${growthRate > 0 ? `+${growthRate.toFixed(1)}% above typical` : growthRate < 0 ? `${growthRate.toFixed(1)}% below typical` : 'at typical level'} (10% weight)`}>
            <span className="stat-label">Trend</span>
            <span className={`stat-value ${growth.class}`}>{growth.text}</span>
          </div>
        </div>

        <div className="score-section">
          <div className="score-label">Assignment Score</div>
          <div className="score-bar-container">
            <div
              className={`score-bar score-bar-${recommendationLevel}`}
              style={{ width: `${assignmentScore}%` }}
            />
          </div>
          <div className="score-value">{assignmentScore}/100</div>
        </div>

        <div className="score-explanation">
          Lower score = Higher assignment priority
        </div>

        {burnout && burnout.burnoutLevel !== 'none' && (
          <div className={`protection-warning burnout-${burnout.burnoutLevel}`}>
            <div className="protection-text">
              <strong>
                {burnout.burnoutLevel === 'severe' && 'Burnout Risk'}
                {burnout.burnoutLevel === 'warning' && 'High Load Warning'}
                {burnout.burnoutLevel === 'caution' && 'Load Caution'}
              </strong>
              <span>
                {burnout.consecutiveHighMonths} consecutive months ≥{burnout.threshold}h (1.25× their avg, capped at 45h)
              </span>
              <span style={{ fontSize: '0.8em', display: 'block', marginTop: '0.25rem', fontStyle: 'italic' }}>
                +{burnout.penalty} points added to protect from overwork
              </span>
            </div>
          </div>
        )}

        {loadBalancing && loadBalancing.protectionLevel !== 'none' && (
          <div className={`protection-warning load-balancing-${loadBalancing.protectionLevel}`}>
            <div className="protection-text">
              <strong>Load Balancing Protection</strong>
              <span>
                {loadBalancing.consecutiveHighLoadMonths} consecutive months significantly above team average (1.5 standard deviations)
              </span>
              <span style={{ fontSize: '0.8em', display: 'block', marginTop: '0.25rem', fontStyle: 'italic' }}>
                +{loadBalancing.penalty} points added to redistribute workload fairly
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicianCard;
