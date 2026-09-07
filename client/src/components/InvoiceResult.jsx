import LineItemsTable from "./LineItemsTable";
import TotalSummary from "./TotalSummary";
import SyncStatus from "./SyncStatus";

/**
 * Formats a date string into "DD Mon YYYY" format gracefully.
 */
function formatInvoiceDate(dateStr) {
  if (!dateStr) return "—";
  try {
    // If format is YYYY-MM-DD
    const parts = String(dateStr).trim().split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(Date.UTC(year, month, day));
      if (!isNaN(d.getTime())) {
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        return `${String(day).padStart(2, "0")} ${months[month]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    return dateStr;
  } catch {
    return dateStr;
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

  return (
    <div
      className="invoice-result-card"
      role="region"
      aria-label="Processed Invoice Result"
    >
      {/* Workflow Status Checklist */}
      <div className="status-checklist">
        <div className="checklist-item done">
          <span className="checklist-icon" aria-hidden="true">
            ✓
          </span>
          <span className="checklist-text">Invoice processed</span>
        </div>
        <div className="checklist-item done">
          <span className="checklist-icon" aria-hidden="true">
            ✓
          </span>
          <span className="checklist-text">Invoice validated</span>
        </div>
        <div className={`checklist-item ${isSynced ? "done" : "failed"}`}>
          <span className="checklist-icon" aria-hidden="true">
            {isSynced ? "✓" : "⚠"}
          </span>
          <span className="checklist-text">
            {isSynced ? "Synced to Google Sheets" : "Google Sheets sync failed"}
          </span>
        </div>
      </div>

      {/* Sync Status Banner */}
      <SyncStatus sync={sync} />

      {/* Invoice Overview Grid */}
      <div className="invoice-details-section">
        <h3 className="section-heading">Invoice Details</h3>
        <div className="invoice-metadata-grid">
          <div className="metadata-item">
            <span className="metadata-label">Vendor</span>
            <span className="metadata-value vendor-name">{vendor || "—"}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Invoice Number</span>
            <span className="metadata-value">{invoiceNumber || "—"}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Invoice Date</span>
            <span className="metadata-value">
              {formatInvoiceDate(invoiceDate)}
            </span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Currency</span>
            <span className="metadata-value">{currency || "—"}</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <LineItemsTable lineItems={lineItems} currency={currency} />

      {/* Totals Breakdown */}
      <TotalSummary
        subtotal={subtotal}
        tax={tax}
        totalAmount={totalAmount}
        currency={currency}
      />

      {/* Process Another Action */}
      <button
        type="button"
        className="upload-btn secondary reset-btn"
        onClick={onReset}
      >
        Process Another Invoice
      </button>
    </div>
  );
}

export default InvoiceResult;
