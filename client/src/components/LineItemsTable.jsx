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

function LineItemsTable({ lineItems = [], currency = "" }) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return (
      <div className="line-items-section">
        <h3 className="section-heading">Line Items</h3>
        <div className="line-items-empty">
          <p>No individual line items detected in this invoice.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="line-items-section">
      <h3 className="section-heading">Line Items</h3>
      <div className="table-responsive">
        <table className="line-items-table" aria-label="Invoice Line Items">
          <thead>
            <tr>
              <th scope="col" className="col-desc">
                Description
              </th>
              <th scope="col" className="col-qty">
                Qty
              </th>
              <th scope="col" className="col-price">
                Unit Price
              </th>
              <th scope="col" className="col-amount">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LineItemsTable;
