import { extractTextFromPdf } from "../services/pdfService.js";
import { extractInvoiceData } from "../services/invoiceExtractionService.js";

/**
 * Invoice controller — Phase 4.
 *
 * Coordinates the full pipeline:
 * 1. Receives and validates uploaded PDF file.
 * 2. Extracts raw text via pdfService.
 * 3. Extracts structured accounting data via invoiceExtractionService (LLM).
 * 4. Returns structured invoice JSON.
 */

/**
 * POST /api/invoices/process
 */
export async function processInvoice(req, res, next) {
  try {
    // 1. Check that a file was uploaded
    if (!req.file) {
      const error = new Error("No invoice PDF was uploaded");
      error.statusCode = 400;
      return next(error);
    }

    // 2. Validate PDF magic bytes (%PDF-) from the buffer
    const buffer = req.file.buffer;
    if (!buffer || buffer.length < 5) {
      const error = new Error(
        "The uploaded file appears to be empty or corrupted",
      );
      error.statusCode = 400;
      return next(error);
    }

    const header = buffer.subarray(0, 5).toString("ascii");
    if (!header.startsWith("%PDF-")) {
      const error = new Error("Only PDF files are allowed");
      error.statusCode = 400;
      return next(error);
    }

    // 3. Extract raw text from the PDF buffer
    console.log(
      `[INVOICE] Received: ${req.file.originalname} (${req.file.size} bytes)`,
    );
    const extractedText = await extractTextFromPdf(buffer);

    // 4. Validate that meaningful text was found
    if (!extractedText || extractedText.length === 0) {
      const error = new Error("No extractable text was found in the PDF");
      error.statusCode = 422;
      return next(error);
    }

    console.log(
      `[INVOICE] PDF text extracted (${extractedText.length} characters)`,
    );

    // 5. Send raw text to LLM for structured invoice extraction
    console.log("[INVOICE] LLM extraction started");
    const invoice = await extractInvoiceData(extractedText);
    console.log("[INVOICE] LLM extraction completed");

    // 6. Return structured invoice response
    res.status(200).json({
      success: true,
      message: "Invoice processed successfully",
      invoice,
    });
  } catch (err) {
    next(err);
  }
}
