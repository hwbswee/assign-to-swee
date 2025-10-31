import React, { useState, useMemo } from 'react';
import { cliniciansData, levelLabels } from './data/clinicians';
import { calculateAssignmentScore, getRecommendationLevel, sortByAssignmentScore } from './utils/scoring';
import { enrichWithWorkloadMetrics } from './utils/workloadMetrics';
import ClinicianCard from './components/ClinicianCard';
import WorkloadGraph from './components/WorkloadGraph';
import Clock from './components/Clock';

function App() {
  const [selectedLevel, setSelectedLevel] = useState('all');

  // Calculate scores for all clinicians with new fair formula
  const cliniciansWithScores = useMemo(() => {
    const enrichedData = enrichWithWorkloadMetrics(cliniciansData);
    return enrichedData.map(clinician => {
      const assignmentScore = calculateAssignmentScore(clinician, enrichedData);
      const recommendationLevel = getRecommendationLevel(assignmentScore);
      return {
        ...clinician,
        assignmentScore,
        recommendationLevel
      };
    });
  }, []);

  // Filter and sort clinicians
  const filteredClinicians = useMemo(() => {
    const filtered = selectedLevel === 'all'
      ? cliniciansWithScores
      : cliniciansWithScores.filter(c => c.level === selectedLevel);
    return sortByAssignmentScore(filtered);
  }, [cliniciansWithScores, selectedLevel]);

  const selectLevel = (level) => {
    setSelectedLevel(level);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">Assign to Who?</h1>
            <p className="app-subtitle">Fair workload-based recommendations</p>
          </div>
          <Clock />
        </div>
      </header>

      <div className="container">
        <section className="filter-section">
          <h2 className="filter-title">Filter by Level</h2>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${selectedLevel === 'all' ? 'active' : ''}`}
              onClick={() => selectLevel('all')}
            >
              All
            </button>
            {Object.entries(levelLabels).map(([key, label]) => (
              <button
                key={key}
                className={`filter-btn filter-btn-${key} ${selectedLevel === key ? 'active' : ''}`}
                onClick={() => selectLevel(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="results-section">
          <div className="results-header">
            <h2 className="results-title">
              {filteredClinicians.length > 0
                ? `${filteredClinicians.length} Therapist${filteredClinicians.length !== 1 ? 's' : ''} Available`
                : 'No Therapists Match Filter'}
            </h2>
            {filteredClinicians.length > 0 && (
              <>
                <p className="results-subtitle">
                  Ranked by availability (lowest workload first)
                </p>
                <div className="metrics-info">
                  <div className="formula-header">
                    <strong>Fair Scoring Formula (Lower = Better):</strong>
                  </div>
                  <div className="formula-grid">
                    <div className="metric-explanation">
                      <strong>40% Active Cases</strong> - Current caseload (clients seen in last 2 months)
                    </div>
                    <div className="metric-explanation">
                      <strong>25% Current Month</strong> - What's happening RIGHT NOW (Oct 2025)
                    </div>
                    <div className="metric-explanation">
                      <strong>25% 6-Month Trend</strong> - Sustained pattern (May-Oct 2025 average)
                    </div>
                    <div className="metric-explanation">
                      <strong>10% Growth Rate</strong> - Workload trajectory (recent vs previous 3 months)
                    </div>
                  </div>
                  <div className="scoring-note">
                    Note: Scores are calculated across all clinicians to ensure fairness. Leads with fewer cases will have lower scores than juniors with many cases.
                  </div>
                </div>
              </>
            )}
          </div>

          {filteredClinicians.length === 0 ? (
            <div className="empty-state">
              <p>Please select at least one therapist level to view recommendations.</p>
            </div>
          ) : (
            <div className="clinicians-grid">
              {filteredClinicians.map((clinician, index) => (
                <ClinicianCard
                  key={clinician.name}
                  clinician={clinician}
                  rank={index + 1}
                />
              ))}
            </div>
          )}
        </section>

        {filteredClinicians.length > 0 && (
          <section className="graph-section">
            <WorkloadGraph clinicians={filteredClinicians} />
          </section>
        )}
      </div>

      <footer className="app-footer">
        <p>Fair Formula: 40% Active Cases + 25% Current Month + 25% 6-Month Trend + 10% Growth Rate</p>
      </footer>
    </div>
  );
}

export default App;
