import './ErrorBanner.css';

/**
 * Error type → icon mapping for visual distinction.
 */
const ERROR_ICONS = {
  NETWORK: '🌐',
  VALIDATION: '⚠️',
  SCHEMA_VALIDATION: '🤖',
  SERVER: '⚙️',
  UNKNOWN: '❌',
};

export default function ErrorBanner({ error, onDismiss, onRetry }) {
  if (!error) return null;

  const icon = ERROR_ICONS[error.type] || ERROR_ICONS.UNKNOWN;
  const isRetryable = error.type !== 'VALIDATION';

  return (
    <div className="error-banner" role="alert">
      <div className="error-banner__content">
        <span className="error-banner__icon">{icon}</span>
        <p className="error-banner__message">{error.message}</p>
      </div>
      <div className="error-banner__actions">
        {isRetryable && onRetry && (
          <button className="error-banner__retry-btn" onClick={onRetry}>
            Retry
          </button>
        )}
        <button className="error-banner__dismiss-btn" onClick={onDismiss} aria-label="Dismiss error">
          ✕
        </button>
      </div>
    </div>
  );
}
