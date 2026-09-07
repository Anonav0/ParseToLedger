function formatTimestamp(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return d.toLocaleString();
  } catch {
    return isoStr;
  }
}

function SyncStatus({ sync }) {
  if (!sync) return null;

  const isSynced = sync.status === "success";
  const isSyncFailed = sync.status === "failed";

  if (!isSynced && !isSyncFailed) return null;

  return (
    <div className="sync-status-container" role="status">
      {isSynced && (
        <div className="sync-status-banner success">
          <div className="sync-banner-header">
            <span className="sync-badge success">
              ✓ Synced to Google Sheets
            </span>
          </div>
          <p className="sync-text">
            Appended to <strong>{sync.destination || "Google Sheets"}</strong>
            {sync.processedAt && ` at ${formatTimestamp(sync.processedAt)}`}
          </p>
        </div>
      )}

      {isSyncFailed && (
        <div className="sync-status-banner warning">
          <div className="sync-banner-header">
            <span className="sync-badge warning">
              ⚠ Google Sheets sync failed
            </span>
          </div>
          <p className="sync-text">
            The invoice was validated successfully, but could not be
            synchronized with <strong>Google Sheets</strong>. Validated invoice
            data is preserved below.
          </p>
        </div>
      )}
    </div>
  );
}

export default SyncStatus;
