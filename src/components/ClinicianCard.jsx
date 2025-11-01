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
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.8125rem', color: '#92400e', lineHeight: '1.5' }}>
              <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>🟡 Load Caution</div>
              <div style={{ fontSize: '0.75rem', color: '#78350f' }}>
                {burnout.consecutiveHighMonths} months ≥{burnout.threshold}h • +{burnout.penalty} pts
              </div>
            </div>
          </div>
        )}

        {loadBalancing && loadBalancing.protectionLevel !== 'none' && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.8125rem', color: '#1e40af', lineHeight: '1.5' }}>
              <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>🔵 Load Balancing</div>
              <div style={{ fontSize: '0.75rem', color: '#1e3a8a' }}>
                {loadBalancing.consecutiveHighLoadMonths} months 1.5 SD above avg • +{loadBalancing.penalty} pts
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicianCard;
