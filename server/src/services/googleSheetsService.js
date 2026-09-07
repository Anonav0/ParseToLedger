import { getGoogleSheetsClient } from "../config/google.js";
import env from "../config/env.js";

/**
 * The 10 standard columns required in the accounting Google Sheet.
 */
export const SHEET_HEADERS = [
  "Vendor",
  "Invoice Number",
  "Invoice Date",
  "Currency",
  "Line Items",
  "Subtotal",
  "Tax",
  "Total Amount",
  "Processed At",
  "Status",
];

/**
 * Custom error class for Google Sheets synchronization errors.
 */
export class GoogleSheetsSyncError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = "GoogleSheetsSyncError";
    this.statusCode = statusCode;
    this.destination = "Google Sheets";
  }
}

/**
 * Format invoice line items into a readable, multi-line string for a single spreadsheet cell.
 * Example:
 * "Product A x2 @ 500 = 1000\nProduct B x1 @ 250 = 250"
 *
 * @param {Array} lineItems
 * @returns {string}
 */
export function formatLineItemsCell(lineItems) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return "—";
  }

  return lineItems
    .map((item) => {
      const desc = item.description || "Item";
      const qty = item.quantity != null ? `x${item.quantity}` : "";
      const price = item.unitPrice != null ? `@ ${item.unitPrice}` : "";
      const amount = item.amount != null ? `= ${item.amount}` : "";
      const details = [qty, price, amount].filter(Boolean).join(" ");
      return details ? `${desc} ${details}` : desc;
    })
    .join("\n");
}

/**
 * Ensures the first row of the configured worksheet contains the expected 10 column headers.
 * Does not overwrite or duplicate headers if already present.
 *
 * @param {object} sheets - Authenticated Google Sheets client
 * @param {string} spreadsheetId
 * @param {string} sheetName
 */
export async function ensureSheetHeaders(sheets, spreadsheetId, sheetName) {
  const range = `'${sheetName}'!A1:J1`;

  let existingHeaders = [];
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    existingHeaders = response.data.values ? response.data.values[0] || [] : [];
  } catch (err) {
    handleGoogleApiError(err, "reading sheet headers");
  }

  // Check if headers are already identical to expected headers
  const isMatch =
    existingHeaders.length === SHEET_HEADERS.length &&
    SHEET_HEADERS.every(
      (header, idx) =>
        String(existingHeaders[idx]).trim().toLowerCase() ===
        header.toLowerCase(),
    );

  if (!isMatch) {
    console.log(
      `[GOOGLE SHEETS] Provisioning standard headers on '${sheetName}'...`,
    );
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [SHEET_HEADERS],
        },
      });
      console.log("[GOOGLE SHEETS] Header row created successfully");
    } catch (err) {
      handleGoogleApiError(err, "provisioning sheet headers");
    }
  }
}

/**
 * Append a validated invoice as a new row to the configured Google Sheet.
 *
 * @param {object} invoice - Validated invoice object
 * @returns {Promise<{status: string, destination: string, processedAt: string}>}
 * @throws {GoogleSheetsSyncError} If authentication, permission, or API operation fails
 */
export async function appendInvoice(invoice) {
  if (!invoice || typeof invoice !== "object") {
    throw new GoogleSheetsSyncError("Cannot sync invalid invoice data", 400);
  }

  const spreadsheetId = env.GOOGLE_SPREADSHEET_ID;
  const sheetName = env.GOOGLE_SHEET_NAME || "Sheet1";

  // 1. Get authenticated client
  const sheets = getGoogleSheetsClient();

  // 2. Ensure header row exists
  await ensureSheetHeaders(sheets, spreadsheetId, sheetName);

  // 3. Format row data
  const processedAt = new Date().toISOString();
  const status = "Synced";
  const lineItemsFormatted = formatLineItemsCell(invoice.lineItems);

  const row = [
    invoice.vendor || "",
    invoice.invoiceNumber || "",
    invoice.invoiceDate || "",
    invoice.currency || "",
    lineItemsFormatted,
    invoice.subtotal != null ? invoice.subtotal : "",
    invoice.tax != null ? invoice.tax : "",
    invoice.totalAmount != null ? invoice.totalAmount : "",
    processedAt,
    status,
  ];

  // 4. Append row to spreadsheet
  console.log(
    `[GOOGLE SHEETS] Appending invoice row for ${invoice.vendor || "Unknown Vendor"} (${invoice.invoiceNumber || "No ID"})...`,
  );

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${sheetName}'!A:J`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [row],
      },
    });

    console.log("[GOOGLE SHEETS] Invoice row successfully appended");
    return {
      status: "success",
      destination: "Google Sheets",
      processedAt,
    };
  } catch (err) {
    handleGoogleApiError(err, "appending invoice row");
  }
}

/**
 * Translates low-level Google API errors into friendly, safe, structured errors.
 * Never leaks private keys or credentials.
 *
 * @param {Error} err
 * @param {string} operation
 */
function handleGoogleApiError(err, operation) {
  console.error(
    `[GOOGLE SHEETS ERROR] Failure during ${operation}: ${err.message}`,
  );

  const status = err.code || err.status;
  const msg = err.message || "";

  if (
    status === 401 ||
    msg.includes("invalid_grant") ||
    msg.includes("unauthorized") ||
    msg.includes("Invalid Credentials")
  ) {
    throw new GoogleSheetsSyncError("Google Sheets authentication failed", 502);
  }

  if (status === 403 || msg.includes("PERMISSION_DENIED")) {
    throw new GoogleSheetsSyncError(
      "The service account does not have access to the configured spreadsheet",
      502,
    );
  }

  if (status === 404 || msg.includes("NOT_FOUND")) {
    throw new GoogleSheetsSyncError(
      "Configured Google Spreadsheet could not be found",
      502,
    );
  }

  if (msg.includes("Unable to parse range") || msg.includes("does not exist")) {
    throw new GoogleSheetsSyncError(
      `Configured worksheet could not be found in the spreadsheet`,
      502,
    );
  }

  throw new GoogleSheetsSyncError(
    "Unable to synchronize invoice with Google Sheets",
    502,
  );
}
