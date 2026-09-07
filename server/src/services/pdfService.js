import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Lightweight normalization of extracted raw text.
 * Preserves numbers, dates, vendor names, currency symbols, and meaningful line breaks.
 *
 * @param {string} rawText
 * @returns {string}
 */
export function normalizeText(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  return (
    rawText
      // Standardize newline characters
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Replace horizontal whitespace runs with single space
      .replace(/[ \t]+/g, " ")
      // Collapse 3 or more consecutive newlines into 2
      .replace(/\n{3,}/g, "\n\n")
      // Trim outer whitespace
      .trim()
  );
}

/**
 * Extract raw text from a PDF buffer.
 *
 * @param {Buffer} buffer - In-memory PDF buffer from Multer
 * @returns {Promise<string>} Normalized extracted text
 * @throws {Error} If the PDF cannot be read or parsed
 */
export async function extractTextFromPdf(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    const error = new Error("Invalid PDF buffer");
    error.statusCode = 400;
    throw error;
  }

  let data;
  try {
    // Convert Node Buffer to Uint8Array so pdf.js receives a dedicated byte slice
    // rather than sharing Node.js's internal Buffer memory pool slab.
    const uint8Array = new Uint8Array(buffer);
    data = await pdfParse(uint8Array);
  } catch (err) {
    console.error(`[PDF SERVICE ERROR] Failed to parse PDF: ${err.message}`);
    const parseError = new Error(
      "Unable to read the PDF. The file may be corrupted or unsupported.",
    );
    parseError.statusCode = 422;
    throw parseError;
  }

  return normalizeText(data.text);
}
