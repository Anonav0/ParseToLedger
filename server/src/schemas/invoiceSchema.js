import { Type } from "@google/genai";
import { z } from "zod";

/**
 * Validates that a YYYY-MM-DD string is a genuine calendar date.
 * Rejects impossible dates such as 2026-02-31, 2026-99-99, or invalid leap year days.
 *
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidCalendarDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  // new Date(year, month, 0).getDate() returns the total days in that month
  const maxDays = new Date(year, month, 0).getDate();
  return day <= maxDays;
}

/**
 * Authoritative Zod schema for a single invoice line item.
 * Enforces strict object properties to disallow unknown fields.
 */
export const lineItemZodSchema = z
  .object({
    description: z
      .string({ invalid_type_error: "Line item description must be a string" })
      .trim()
      .min(1, "Line item description cannot be empty"),
    quantity: z
      .number({ invalid_type_error: "Line item quantity must be a number" })
      .finite("Line item quantity must be finite")
      .gt(0, "Line item quantity must be greater than zero"),
    unitPrice: z
      .number({ invalid_type_error: "Line item unit price must be a number" })
      .finite("Line item unit price must be finite")
      .nonnegative("Line item unit price cannot be negative"),
    amount: z
      .number({ invalid_type_error: "Line item amount must be a number" })
      .finite("Line item amount must be finite")
      .nonnegative("Line item amount cannot be negative"),
  })
  .strict("Unexpected field in line item");

/**
 * Authoritative Zod schema for the complete invoice object.
 * Rejects unexpected/arbitrary fields using .strict().
 */
export const invoiceZodSchema = z
  .object({
    vendor: z
      .string({ invalid_type_error: "Vendor must be a string" })
      .trim()
      .min(1, "Vendor cannot be an empty string")
      .nullable(),
    invoiceNumber: z
      .string({ invalid_type_error: "Invoice number must be a string" })
      .trim()
      .min(1, "Invoice number cannot be an empty string")
      .nullable(),
    invoiceDate: z
      .string({ invalid_type_error: "Invoice date must be a string" })
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Invoice date must follow YYYY-MM-DD format",
      )
      .refine(isValidCalendarDate, {
        message: "Invoice date must be a valid calendar date",
      })
      .nullable(),
    currency: z
      .string({ invalid_type_error: "Currency must be a string" })
      .trim()
      .min(1, "Currency cannot be an empty string")
      .max(5, "Currency code is too long")
      .toUpperCase()
      .nullable(),
    lineItems: z.array(lineItemZodSchema, {
      invalid_type_error: "Line items must be an array",
    }),
    subtotal: z
      .number({ invalid_type_error: "Subtotal must be a number" })
      .finite("Subtotal must be finite")
      .nonnegative("Subtotal cannot be negative")
      .nullable(),
    tax: z
      .number({ invalid_type_error: "Tax must be a number" })
      .finite("Tax must be finite")
      .nonnegative("Tax cannot be negative")
      .nullable(),
    totalAmount: z
      .number({ invalid_type_error: "Total amount must be a number" })
      .finite("Total amount must be finite")
      .nonnegative("Total amount cannot be negative")
      .nullable(),
  })
  .strict("Unexpected field in invoice");

/**
 * Google GenAI JSON Schema definition for structured output.
 */
export const invoiceGenAISchema = {
  type: Type.OBJECT,
  description: "Structured accounting data extracted from an invoice document.",
  properties: {
    vendor: {
      type: Type.STRING,
      description:
        "The vendor, supplier, or company issuing the invoice. Return null if cannot be determined.",
      nullable: true,
    },
    invoiceNumber: {
      type: Type.STRING,
      description:
        "The official invoice number or reference code. Return null if cannot be determined.",
      nullable: true,
    },
    invoiceDate: {
      type: Type.STRING,
      description:
        "The invoice issue date in YYYY-MM-DD format. Return null if cannot be determined.",
      nullable: true,
    },
    currency: {
      type: Type.STRING,
      description:
        "The 3-letter ISO currency code (e.g. INR, USD, EUR, GBP). Return null if cannot be determined.",
      nullable: true,
    },
    lineItems: {
      type: Type.ARRAY,
      description:
        "List of individual product or service line items on the invoice.",
      items: {
        type: Type.OBJECT,
        properties: {
          description: {
            type: Type.STRING,
            description:
              "Description of the item or service. Return null if cannot be determined.",
            nullable: true,
          },
          quantity: {
            type: Type.NUMBER,
            description: "Item quantity. Return null if cannot be determined.",
            nullable: true,
          },
          unitPrice: {
            type: Type.NUMBER,
            description:
              "Unit price as a decimal number without currency symbols. Return null if cannot be determined.",
            nullable: true,
          },
          amount: {
            type: Type.NUMBER,
            description:
              "Total line item amount as a decimal number. Return null if cannot be determined.",
            nullable: true,
          },
        },
        required: ["description", "quantity", "unitPrice", "amount"],
      },
    },
    subtotal: {
      type: Type.NUMBER,
      description:
        "Invoice subtotal amount before taxes. Return null if cannot be determined.",
      nullable: true,
    },
    tax: {
      type: Type.NUMBER,
      description: "Total tax amount. Return null if cannot be determined.",
      nullable: true,
    },
    totalAmount: {
      type: Type.NUMBER,
      description:
        "Final grand total amount payable. Return null if cannot be determined.",
      nullable: true,
    },
  },
  required: [
    "vendor",
    "invoiceNumber",
    "invoiceDate",
    "currency",
    "lineItems",
    "subtotal",
    "tax",
    "totalAmount",
  ],
};

// Default export alias for GenAI backward compatibility
export const invoiceSchema = invoiceGenAISchema;
