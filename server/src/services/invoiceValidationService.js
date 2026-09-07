import { invoiceZodSchema } from "../schemas/invoiceSchema.js";

/**
 * Monetary rounding tolerance.
 * Allows small rounding differences (e.g. up to 5 cents) commonly found
 * on printed invoices due to per-unit decimal rounding.
 */
export const ROUNDING_TOLERANCE = 0.05;

/**
 * Custom error class for validation failures.
 */
export class InvoiceValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "InvoiceValidationError";
    this.statusCode = 422;
    this.errors = errors;
  }
}

/**
 * Validates invoice data using Zod schema followed by business rule checks.
 *
 * @param {object} invoiceData - Raw structured invoice data from LLM
 * @returns {object} Validated, trusted invoice data
 * @throws {InvoiceValidationError} If schema or business math validation fails
 */
export function validateInvoice(invoiceData) {
  if (!invoiceData || typeof invoiceData !== "object") {
    throw new InvoiceValidationError("Invoice data must be a valid object", [
      {
        field: "root",
        message: "Expected an object representing invoice data",
      },
    ]);
  }

  // 1. Zod Schema Validation (structural, types, calendar dates, positive numbers)
  const zodResult = invoiceZodSchema.safeParse(invoiceData);
  if (!zodResult.success) {
    const formattedErrors = zodResult.error.issues.map((issue) => ({
      field: issue.path.join(".") || "root",
      message: issue.message,
    }));

    console.error(
      `[INVOICE VALIDATION ERROR] Zod schema failed with ${formattedErrors.length} issue(s)`,
    );
    throw new InvoiceValidationError(
      "Invoice data failed validation",
      formattedErrors,
    );
  }

  const validated = zodResult.data;
  const businessErrors = [];

  // 2. Business Validation: Line Item Math (quantity * unitPrice ≈ amount)
  if (Array.isArray(validated.lineItems)) {
    validated.lineItems.forEach((item, index) => {
      if (
        item.quantity != null &&
        item.unitPrice != null &&
        item.amount != null
      ) {
        const expected = item.quantity * item.unitPrice;
        const diff = Math.abs(expected - item.amount);
        if (diff > ROUNDING_TOLERANCE) {
          businessErrors.push({
            field: `lineItems.${index}.amount`,
            message: `Line item amount (${item.amount}) does not match quantity (${item.quantity}) × unit price (${item.unitPrice}) [expected approx ${expected.toFixed(2)}]`,
          });
        }
      }
    });
  }

  // 3. Business Validation: Subtotal Reconciliation (sum(lineItems) ≈ subtotal)
  if (
    validated.subtotal != null &&
    Array.isArray(validated.lineItems) &&
    validated.lineItems.length > 0
  ) {
    const allItemsHaveAmount = validated.lineItems.every(
      (item) => item.amount != null,
    );
    if (allItemsHaveAmount) {
      const lineItemsSum = validated.lineItems.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      const diff = Math.abs(lineItemsSum - validated.subtotal);
      if (diff > ROUNDING_TOLERANCE) {
        businessErrors.push({
          field: "subtotal",
          message: `Subtotal (${validated.subtotal}) does not match the sum of line items (${lineItemsSum.toFixed(2)})`,
        });
      }
    }
  }

  // 4. Business Validation: Grand Total Reconciliation (subtotal + tax ≈ totalAmount)
  if (
    validated.subtotal != null &&
    validated.tax != null &&
    validated.totalAmount != null
  ) {
    const expectedTotal = validated.subtotal + validated.tax;
    const diff = Math.abs(expectedTotal - validated.totalAmount);
    if (diff > ROUNDING_TOLERANCE) {
      businessErrors.push({
        field: "totalAmount",
        message: `Total amount (${validated.totalAmount}) does not match subtotal (${validated.subtotal}) + tax (${validated.tax}) [expected approx ${expectedTotal.toFixed(2)}]`,
      });
    }
  }

  // If any business validation rule failed, stop and throw
  if (businessErrors.length > 0) {
    console.error(
      `[INVOICE VALIDATION ERROR] Business rules failed with ${businessErrors.length} issue(s)`,
    );
    throw new InvoiceValidationError(
      "Invoice data failed validation",
      businessErrors,
    );
  }

  console.log("[INVOICE] Invoice validation completed successfully");
  return validated;
}
