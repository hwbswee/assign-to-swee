import React, { useState, useMemo, useEffect } from 'react';
import { fetchClinicianData, levelLabels } from './utils/csvParser';
import { calculateAssignmentScore, getRecommendationLevel, sortByAssignmentScore } from './utils/scoring';
import { enrichWithAssignmentMetrics } from './utils/assignmentMetrics';
import { getCurrentMonthName, getPreviousMonthName, getCurrentYear, get6MonthAverageLabel } from './utils/dateUtils';
import ClinicianCard from './components/ClinicianCard';
import AssignmentGraph from './components/AssignmentGraph';
import Clock from './components/Clock';

function App() {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [cliniciansData, setCliniciansData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeWindow, setTimeWindow] = useState(2); // Default 2 months
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch clinician data from CSV on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await fetchClinicianData();
        setCliniciansData(result.clinicians);
        setLastUpdated(result.lastUpdated);
        setError(null);
      } catch (err) {
        setError('Failed to load clinician data. Please refresh the page.');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Calculate scores for all clinicians with new fair formula
  const cliniciansWithScores = useMemo(() => {
    if (cliniciansData.length === 0) return [];

    const enrichedData = enrichWithAssignmentMetrics(cliniciansData);

    // Check if any clinician is using fallback data
    const usingFallback = enrichedData.some(c => c.usingPreviousMonthFallback);
    if (usingFallback && enrichedData.length > 0) {
      console.log('[App] Some clinicians are using previous month data as fallback');
    }

    // Calculate baseline (2 months) for normalization - FIXED baseline
    // This ensures time window changes have meaningful impact
    const baselineMaxActiveCases = Math.max(...enrichedData.map(c => c.activeCases), 1);

    // Adjust active cases based on time window (proportional scaling from 2 months baseline)
    // Using square root scaling to account for client overlap (not perfectly linear)
    const scaleFactor = Math.sqrt(timeWindow / 2);
    console.log(`Time window: ${timeWindow} months, Scale factor: ${scaleFactor.toFixed(3)}`);

    const adjustedData = enrichedData.map(clinician => {
      const adjustedActiveCases = Math.round(clinician.activeCases * scaleFactor);
      return {
        ...clinician,
        activeCases: adjustedActiveCases
      };
    });

    // Pass baseline max for normalization so scores change meaningfully with time window
    const result = adjustedData.map(clinician => {
      const assignmentScore = calculateAssignmentScore(clinician, adjustedData, baselineMaxActiveCases);
      const recommendationLevel = getRecommendationLevel(assignmentScore);
      return {
        ...clinician,
        assignmentScore,
        recommendationLevel
      };
    });

    // Debug: Log first clinician to verify changes
    if (result.length > 0) {
      console.log(`Sample: ${result[0].name} - Active Cases: ${result[0].activeCases}, Score: ${result[0].assignmentScore}`);
    }

    return result;
  }, [cliniciansData, timeWindow]);

  // Filter and sort clinicians
  const filteredClinicians = useMemo(() => {
    const filtered = selectedLevel === 'all'
      ? cliniciansWithScores
      : cliniciansWithScores.filter(c => c.level === selectedLevel);
    return sortByAssignmentScore(filtered);
  }, [cliniciansWithScores, selectedLevel]);

  // Check if we're using fallback data for any clinician
  const usingFallback = cliniciansWithScores.some(c => c.usingPreviousMonthFallback);
  const dayOfMonth = new Date().getDate();

  const selectLevel = (level) => {
    setSelectedLevel(level);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="app-title">Assign to who?</h1>
              <p className="app-subtitle">Fair assignment-based recommendations</p>
            </div>
            <Clock />
          </div>
        </header>
        <div className="container">
          <div className="empty-state">
            <p>Loading clinician data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="app-title">Assign to who?</h1>
              <p className="app-subtitle">Fair assignment-based recommendations</p>
            </div>
            <Clock />
          </div>
        </header>
        <div className="container">
          <div className="empty-state">
            <p style={{ color: '#ef4444' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">Assign to who?</h1>
            <p className="app-subtitle">Fair workload-based recommendations</p>
            {lastUpdated && (
              <p className="data-timestamp" style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                Data last updated: {lastUpdated}
              </p>
            )}
          </div>
          <Clock />
        </div>
      </header>

      <div className="container">
        {usingFallback && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: '#92400e'
          }}>
            <strong>📅 Early Month Notice:</strong> We're on day {dayOfMonth} of the month. Since current month data is limited,
            we're using last month's hours as a proxy for "Current Month" workload. This ensures fair assignment scores.
          </div>
        )}

        <section className="filter-section">
          <div className="filter-header">
            <div>
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
            </div>

            <div className="time-window-control">
              <label className="time-window-label">
                Active Cases Window: <span className="time-window-value">{timeWindow} {timeWindow === 1 ? 'month' : 'months'}</span>
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.5"
                value={timeWindow}
                onChange={(e) => setTimeWindow(parseFloat(e.target.value))}
                className="time-window-slider"
              />
              <div className="slider-marks">
                <span>1mo</span>
                <span>2mo</span>
                <span>3mo</span>
              </div>
            </div>
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
                  Ranked by availability (lowest assignment score first)
                </p>

                <div className="formula-section">
                  <div className="formula-intro">
                    <h3 className="formula-title">How Assignment Scores Work</h3>
                    <p className="formula-description">
                      <p>Lower scores indicate possible therapists for new assignments.</p> 
                      <p>Each score is calculated using 4 weighted metrics.</p>
                    </p>
                  </div>

                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-header">
                        <h4 className="metric-title">Active Cases</h4>
                        <span className="metric-weight">30%</span>
                      </div>
                      <p className="metric-description">
                        Unique clients seen in the last {timeWindow} {timeWindow === 1 ? 'month' : 'months'}
                      </p>
                    </div>

                    <div className="metric-card">
                      <div className="metric-header">
                        <h4 className="metric-title">Current Month</h4>
                        <span className="metric-weight">30%</span>
                      </div>
                      <p className="metric-description">
                        Clinical hours for {usingFallback ? getPreviousMonthName() : getCurrentMonthName()} {getCurrentYear()}
                        {usingFallback && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                            (using last month as proxy)
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="metric-card">
                      <div className="metric-header">
                        <h4 className="metric-title">6-Month Average</h4>
                        <span className="metric-weight">30%</span>
                      </div>
                      <p className="metric-description">
                        {get6MonthAverageLabel()}
                      </p>
                    </div>

                    <div className="metric-card">
                      <div className="metric-header">
                        <h4 className="metric-title">Growth Rate</h4>
                        <span className="metric-weight">10%</span>
                      </div>
                      <p className="metric-description">
                        Current month vs their historical baseline
                      </p>
                    </div>
                  </div>

                  <div className="formula-math">
                    <code className="formula-notation">
                      S = 100 × [0.30 × (AC/max) + 0.30 × (CM/max) + 0.30 × (M6/max) + 0.10 × ((GR−min)/(max−min))]
                    </code>
                  </div>

                  <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '1rem' }}>
                      Protection Systems
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', marginBottom: '0.25rem' }}>
                          Load Caution
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: '1.5' }}>
                          +3 points when working ≥1.25× own average for 2+ months (max 45h)
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', marginBottom: '0.25rem' }}>
                          Load Balancing
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: '1.5' }}>
                          Points added when 1.5 SD above team average for 2+ months
                        </div>
                      </div>
                    </div>
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
            <AssignmentGraph clinicians={filteredClinicians} />
          </section>
        )}
      </div>

      <footer className="app-footer">
        <p>Built for NUS Health and Wellbeing</p>
      </footer>
    </div>
  );
}

export default App;
