interface APIErrorBannerProps {
  error: string;
  onRetry?: () => void;
}

export function APIErrorBanner({ error, onRetry }: APIErrorBannerProps) {
  return (
    <div className="error-banner" role="alert">
      <p className="error-message">{error}</p>
      {onRetry && (
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
