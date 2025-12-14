import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          color: '#fafafa',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
            padding: '40px',
            borderRadius: '12px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              backgroundColor: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              O
            </div>
            <h1 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: 'bold' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#a1a1aa', marginBottom: '24px', fontSize: '14px' }}>
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#6366f1',
                color: '#fafafa',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '24px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#a1a1aa', fontSize: '12px' }}>
                  Error Details
                </summary>
                <pre style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '6px',
                  fontSize: '11px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  color: '#ef4444'
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
