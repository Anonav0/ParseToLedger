const STAGE_NAMES = {
  uploading: "File Upload",
  extracting: "PDF Text Extraction",
  processing_ai: "AI Analysis",
  validating: "Invoice Validation",
  syncing: "Google Sheets Sync",
};

function ErrorState({
  message = "We couldn't process this invoice.",
  validationErrors = [],
  failedStage = null,
  onRetry,
  onReset,
}) {
  return (
    <div className="error-state-card" role="alert" aria-live="assertive">
      <div className="error-icon-wrapper" aria-hidden="true">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3 className="error-title">Something went wrong</h3>
      <p className="error-description">{message}</p>

      {failedStage && STAGE_NAMES[failedStage] && (
        <span className="error-stage-badge">
          Failed during: {STAGE_NAMES[failedStage]}
        </span>
      )}

      {Array.isArray(validationErrors) && validationErrors.length > 0 && (
        <div className="error-details-box">
          <p className="error-details-title">Validation Issues Found:</p>
          <ul className="error-details-list">
            {validationErrors.map((err, idx) => (
              <li key={idx} className="error-details-item">
                <code className="error-field-tag">{err.field || "field"}</code>
                <span className="error-field-msg">{err.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="error-actions">
        {onRetry && (
          <button
            type="button"
            className="upload-btn primary"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
        {onReset && (
          <button
            type="button"
            className="upload-btn secondary"
            onClick={onReset}
          >
            Choose Another File
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorState;
