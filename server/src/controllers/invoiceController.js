import { extractTextFromPdf } from "../services/pdfService.js";
import { extractInvoiceData } from "../services/invoiceExtractionService.js";
import { validateInvoice } from "../services/invoiceValidationService.js";
import { appendInvoice } from "../services/googleSheetsService.js";

/**
 * Invoice controller — Phase 6.
 *
 * Coordinates the full end-to-end pipeline:
 * 1. Receives and validates uploaded PDF file.
 * 2. Extracts raw text via pdfService.
 * 3. Extracts structured data via invoiceExtractionService (LLM).
 * 4. Validates structured data via invoiceValidationService (Zod + Business Rules).
 * 5. Appends validated invoice to Google Sheets ERP via googleSheetsService.
 * 6. Returns structured invoice and sync status.
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
    const rawInvoice = await extractInvoiceData(extractedText);
    console.log("[INVOICE] LLM extraction completed");

    // 6. Validate AI output using Zod schema and business logic
    console.log("[INVOICE] Invoice validation started");
    const validatedInvoice = validateInvoice(rawInvoice);
    console.log("[INVOICE] Invoice validation completed");

    // 7. Send validated invoice to Google Sheets ERP
    console.log("[INVOICE] Google Sheets sync started");
    let syncResult;
    try {
      syncResult = await appendInvoice(validatedInvoice);
      console.log("[INVOICE] Google Sheets sync completed successfully");
    } catch (syncErr) {
      console.error(`[INVOICE SYNC FAILED] ${syncErr.message}`);
      return res.status(syncErr.statusCode || 502).json({
        success: false,
        message:
          syncErr.message ||
          "Invoice was validated but could not be synchronized with Google Sheets",
        invoice: validatedInvoice,
        sync: {
          status: "failed",
          destination: "Google Sheets",
        },
      });
    }

    // 8. Return complete success response with validated invoice and sync status
    res.status(200).json({
      success: true,
      message: "Invoice processed and synced successfully",
      invoice: validatedInvoice,
      sync: {
        status: "success",
        destination: "Google Sheets",
        processedAt: syncResult.processedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
