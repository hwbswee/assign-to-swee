import React from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error details:', errorInfo);

    // Update state with error information
    this.setState({
      error,
      errorInfo
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="app">
          <header className="app-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="app-title">Assign to Who?</h1>
                <p className="app-subtitle">Fair workload-based recommendations</p>
              </div>
            </div>
          </header>
          <div className="container">
            <div className="empty-state" style={{ padding: '2rem' }}>
              <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>
                Something went wrong
              </h2>
              <p style={{ marginBottom: '1rem' }}>
                An unexpected error occurred while processing the data. This could be due to:
              </p>
              <ul style={{ textAlign: 'left', marginBottom: '1.5rem', paddingLeft: '2rem' }}>
                <li>Malformed CSV data</li>
                <li>Missing or invalid clinician information</li>
                <li>Corrupted monthly hours data</li>
                <li>A browser compatibility issue</li>
              </ul>
              {this.state.error && (
                <details style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Technical Details (click to expand)
                  </summary>
                  <pre style={{
                    background: '#1e1e1e',
                    color: '#d4d4d4',
                    padding: '1rem',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}>
                    <strong>Error:</strong> {this.state.error.toString()}
                    {this.state.errorInfo && (
                      <>
                        {'\n\n'}
                        <strong>Stack Trace:</strong>
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Reload Page
                </button>
                <button
                  onClick={this.resetError}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Try Again
                </button>
              </div>
              <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                If this problem persists, please check the CSV file format and ensure all data is valid.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
