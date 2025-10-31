import React from 'react';

const ClinicianCard = ({ clinician, rank }) => {
  const { name, fullName, level, currentMonth, sixMonthAverage, growthRate, activeCases, assignmentScore, recommendationLevel } = clinician;

  const displayName = fullName || name;

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
          <h3 className="clinician-name">{displayName}</h3>
          <span className="clinician-level">{level}</span>
        </div>
        {getRecommendationBadge()}
      </div>

      <div className="card-body">
        <div className="stat-grid">
          <div className="stat-item" title="Current caseload: Clients seen in last 2 months (40% weight)">
            <span className="stat-label">Active Cases</span>
            <span className="stat-value">{activeCases}</span>
          </div>
          <div className="stat-item" title="Current month clinical hours - October 2025 (25% weight)">
            <span className="stat-label">Current Month</span>
            <span className="stat-value">{currentMonth}h</span>
          </div>
          <div className="stat-item" title="6-month average: May-Oct 2025 (25% weight)">
            <span className="stat-label">6-Month Avg</span>
            <span className="stat-value">{sixMonthAverage}h</span>
          </div>
          <div className="stat-item" title={`Workload trajectory: ${growthRate > 0 ? 'increasing' : growthRate < 0 ? 'decreasing' : 'stable'} (${growthRate.toFixed(1)}% - 10% weight)`}>
            <span className="stat-label">Trend</span>
            <span className={`stat-value ${growth.class}`}>{growth.text}</span>
          </div>
        </div>

        <div className="score-section">
          <div className="score-label">Workload Score</div>
          <div className="score-bar-container">
            <div
              className={`score-bar score-bar-${recommendationLevel}`}
              style={{ width: `${assignmentScore}%` }}
            />
          </div>
          <div className="score-value">{assignmentScore}/100</div>
        </div>

        <div className="score-explanation">
          Lower score = Lower current workload = Better candidate
        </div>
      </div>
    </div>
  );
};

export default ClinicianCard;
