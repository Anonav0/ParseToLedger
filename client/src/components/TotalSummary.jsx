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

function TotalSummary({ subtotal, tax, totalAmount, currency = "" }) {
  return (
    <div className="totals-section" aria-label="Invoice Totals Breakdown">
      <div className="totals-row">
        <span className="totals-label">Subtotal</span>
        <span className="totals-value">{formatAmount(subtotal, currency)}</span>
      </div>

      <div className="totals-row">
        <span className="totals-label">Tax</span>
        <span className="totals-value">{formatAmount(tax, currency)}</span>
      </div>

      <div className="totals-row grand-total">
        <span className="totals-label">Total Amount</span>
        <span className="totals-value highlight">
          {formatAmount(totalAmount, currency)}
        </span>
      </div>
    </div>
  );
}

export default TotalSummary;
