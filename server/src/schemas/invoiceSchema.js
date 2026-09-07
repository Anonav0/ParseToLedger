import { Type } from "@google/genai";

/**
 * Central JSON Schema definition for structured invoice extraction.
 *
 * Enforces the expected structure using the official @google/genai Type system.
 * Unavailable or ambiguous fields are strictly null.
 */
export const invoiceSchema = {
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
