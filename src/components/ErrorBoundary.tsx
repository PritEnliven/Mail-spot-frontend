import { Component, type ErrorInfo, type ReactNode } from 'react';
import { isChunkLoadError } from '@utils/lazyWithRetry';

const ERROR_RELOAD_KEY = 'mailspot_error_reload';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Catches uncaught render errors so the app never sticks on a blank white screen.
 * Chunk/deploy mismatches auto-reload once; other errors show a Reload action.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Something went wrong',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App ErrorBoundary caught:', error, info.componentStack);

    if (isChunkLoadError(error) && sessionStorage.getItem(ERROR_RELOAD_KEY) !== '1') {
      sessionStorage.setItem(ERROR_RELOAD_KEY, '1');
      window.location.reload();
    }
  }

  private handleReload = () => {
    sessionStorage.removeItem(ERROR_RELOAD_KEY);
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 18, color: '#222' }}>
          Mailspot needs to reload
        </p>
        <p style={{ margin: 0, fontSize: 14, color: '#666', maxWidth: 360 }}>
          The page stopped responding after being idle. Reloading will restore your inbox.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            marginTop: 8,
            padding: '10px 20px',
            border: 'none',
            borderRadius: 6,
            backgroundColor: '#0097ef',
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
