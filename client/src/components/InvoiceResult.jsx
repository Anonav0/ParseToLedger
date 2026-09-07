/**
 * Formats a monetary number into a clean string with 2 decimals if present.
 */
function formatAmount(val, currency = "") {
  if (typeof val !== "number" || isNaN(val)) {
    return "—";
  }
  const formatted = val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${currency} ${formatted}` : formatted;
}

/**
 * Formats an ISO date-time string into a human-readable local timestamp.
 */
function formatTimestamp(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return d.toLocaleString();
  } catch {
    return isoStr;
  }
}

function InvoiceResult({ invoice, sync, onReset }) {
  if (!invoice) return null;

  const {
    vendor,
    invoiceNumber,
    invoiceDate,
    currency,
    lineItems = [],
    subtotal,
    tax,
    totalAmount,
  } = invoice;

  const isSynced = sync?.status === "success";
  const isSyncFailed = sync?.status === "failed";

  return (
    <div className="invoice-result-container">
      {/* Workflow Status Badges */}
      <div className="result-header-banner">
        <div className="badges-group">
          <span className="badge-ai-extracted">✓ AI Extracted</span>
          <span className="badge-validated">✓ Validated</span>
          {isSynced && (
            <span className="badge-synced">✓ Synced to Google Sheets</span>
          )}
          {isSyncFailed && (
            <span className="badge-sync-failed">
              ⚠ Google Sheets Sync Failed
            </span>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      {isSynced && (
        <div className="sync-status-banner success">
          <span className="sync-icon">📊</span>
          <span className="sync-text">
            Appended to <strong>{sync.destination || "Google Sheets"}</strong>
            {sync.processedAt && ` at ${formatTimestamp(sync.processedAt)}`}
          </span>
        </div>
      )}

      {isSyncFailed && (
        <div className="sync-status-banner warning">
          <span className="sync-icon">⚠️</span>
          <span className="sync-text">
            Invoice was validated successfully, but could not be synchronized
            with <strong>Google Sheets</strong>. Validated data is preserved
            below.
          </span>
        </div>
      )}

      {/* Invoice Overview */}
      <div className="invoice-metadata-grid">
        <div className="metadata-item">
          <span className="metadata-label">Vendor</span>
          <span className="metadata-value vendor-name">{vendor || "—"}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Invoice #</span>
          <span className="metadata-value">{invoiceNumber || "—"}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Invoice Date</span>
          <span className="metadata-value">{invoiceDate || "—"}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Currency</span>
          <span className="metadata-value">{currency || "—"}</span>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="line-items-section">
        <h3 className="section-heading">Line Items</h3>
        <div className="table-responsive">
          <table className="line-items-table">
            <thead>
              <tr>
                <th className="col-desc">Description</th>
                <th className="col-qty">Quantity</th>
                <th className="col-price">Unit Price</th>
                <th className="col-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(lineItems) && lineItems.length > 0 ? (
                lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="col-desc">{item.description || "—"}</td>
                    <td className="col-qty">
                      {item.quantity != null ? item.quantity : "—"}
                    </td>
                    <td className="col-price">
                      {formatAmount(item.unitPrice, currency)}
                    </td>
                    <td className="col-amount">
                      {formatAmount(item.amount, currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-items-cell">
                    No line items found in this invoice
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Breakdown */}
      <div className="totals-section">
        <div className="totals-row">
          <span className="totals-label">Subtotal</span>
          <span className="totals-value">
            {formatAmount(subtotal, currency)}
          </span>
        </div>
        <div className="totals-row">
          <span className="totals-label">Tax</span>
          <span className="totals-value">{formatAmount(tax, currency)}</span>
        </div>
        <div className="totals-row grand-total">
          <span className="totals-label">Total Amount</span>
          <span className="totals-value">
            {formatAmount(totalAmount, currency)}
          </span>
        </div>
      </div>

      {/* Reset / New Upload */}
      <button className="upload-btn secondary" onClick={onReset}>
        Process Another Invoice
      </button>
    </div>
  );
}

export default InvoiceResult;
