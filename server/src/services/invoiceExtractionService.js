import { GoogleGenAI } from "@google/genai";
import env from "../config/env.js";
import { invoiceSchema } from "../schemas/invoiceSchema.js";

/**
 * Dedicated system instruction for invoice data extraction.
 */
export const INVOICE_EXTRACTION_SYSTEM_INSTRUCTION = `
You are an expert invoice data extraction engine.
Your sole job is to extract structured accounting data from unstructured invoice text.

Rules:
1. Extract ONLY information explicitly present in the provided invoice text.
2. NEVER invent, assume, or hallucinate missing values.
3. If any field cannot be confidently determined from the text, return null for that field. Do NOT use placeholder values like "N/A", "Unknown", 0, or "None".
4. Distinguish the Vendor (the entity/company issuing the invoice and receiving payment) from the Customer/Buyer/Client (the entity being billed).
5. Distinguish the Invoice Number from Purchase Order (PO) numbers, GST numbers, VAT IDs, account numbers, or tax registration IDs.
6. Normalize invoice dates to YYYY-MM-DD format whenever identifiable. If ambiguous or missing, return null.
7. Normalize currencies to 3-letter ISO currency codes (e.g. INR, USD, EUR, GBP). Return null if not determinable.
8. Extract each identifiable product or service line item. Do NOT include subtotal, tax, shipping, discounts, or grand totals as line items.
9. Return monetary values (unitPrice, amount, subtotal, tax, totalAmount) as pure numbers (e.g. 1050.50), NOT formatted strings (no currency signs or commas).
10. Return strictly structured JSON matching the provided schema. Do not include conversational remarks or explanations.
`.trim();

/**
 * Extract structured invoice data from raw text using the configured LLM.
 *
 * @param {string} text - Raw extracted text from PDF
 * @returns {Promise<object>} Structured invoice matching the invoiceSchema
 * @throws {Error} If LLM is unconfigured, API fails, or response is malformed
 */
export async function extractInvoiceData(text) {
  // 1. Validate input text
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    const error = new Error("No invoice text was provided for extraction");
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate LLM configuration
  if (!env.LLM_API_KEY) {
    console.error("[LLM CONFIG ERROR] LLM_API_KEY is not configured.");
    const error = new Error(
      "LLM API key is not configured. Please set LLM_API_KEY in your server .env file.",
    );
    error.statusCode = 500;
    throw error;
  }

  // 3. Call LLM with structured output schema and 30-second timeout
  const LLM_REQUEST_TIMEOUT_MS = 30000;
  let responseText;

  try {
    const ai = new GoogleGenAI({ apiKey: env.LLM_API_KEY });

    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        const timeoutErr = new Error(
          "AI service request timed out after 30 seconds",
        );
        timeoutErr.isTimeout = true;
        reject(timeoutErr);
      }, LLM_REQUEST_TIMEOUT_MS);
    });

    const generatePromise = ai.models.generateContent({
      model: env.LLM_MODEL || "gemini-2.5-flash",
      contents: text,
      config: {
        systemInstruction: INVOICE_EXTRACTION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: invoiceSchema,
        temperature: 0,
      },
    });

    let response;
    try {
      response = await Promise.race([generatePromise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }

    responseText = response.text;
  } catch (err) {
    if (err.isTimeout) {
      console.error(
        "[LLM SERVICE ERROR] AI generation timed out after 30 seconds",
      );
      const timeoutError = new Error(
        "AI invoice extraction request timed out. Please try again.",
      );
      timeoutError.statusCode = 502;
      throw timeoutError;
    }

    // Sanitize and log technical error on backend
    console.error(`[LLM SERVICE ERROR] Extraction failed: ${err.message}`);
    const apiError = new Error(
      "Unable to extract invoice data using the AI service",
    );
    apiError.statusCode = 502;
    throw apiError;
  }

  // 4. Parse and verify structured response
  if (!responseText) {
    const error = new Error("AI service returned an empty response");
    error.statusCode = 502;
    throw error;
  }

  let invoiceData;
  try {
    invoiceData = JSON.parse(responseText);
  } catch (parseErr) {
    console.error(
      `[LLM RESPONSE ERROR] JSON parsing failed: ${parseErr.message}`,
    );
    const error = new Error(
      "AI service returned an invalid structured invoice response",
    );
    error.statusCode = 502;
    throw error;
  }

  // 5. Basic integrity verification
  if (
    !invoiceData ||
    typeof invoiceData !== "object" ||
    Array.isArray(invoiceData) ||
    !Array.isArray(invoiceData.lineItems)
  ) {
    console.error(
      "[LLM INTEGRITY ERROR] Response failed basic structure check",
      invoiceData,
    );
    const error = new Error("AI service returned an invalid invoice structure");
    error.statusCode = 502;
    throw error;
  }

  // Ensure all schema root fields are present (defaulting to null if undefined)
  const normalizedInvoice = {
    vendor: invoiceData.vendor ?? null,
    invoiceNumber: invoiceData.invoiceNumber ?? null,
    invoiceDate: invoiceData.invoiceDate ?? null,
    currency: invoiceData.currency ?? null,
    lineItems: invoiceData.lineItems.map((item) => ({
      description: item.description ?? null,
      quantity: typeof item.quantity === "number" ? item.quantity : null,
      unitPrice: typeof item.unitPrice === "number" ? item.unitPrice : null,
      amount: typeof item.amount === "number" ? item.amount : null,
    })),
    subtotal:
      typeof invoiceData.subtotal === "number" ? invoiceData.subtotal : null,
    tax: typeof invoiceData.tax === "number" ? invoiceData.tax : null,
    totalAmount:
      typeof invoiceData.totalAmount === "number"
        ? invoiceData.totalAmount
        : null,
  };

  return normalizedInvoice;
}
