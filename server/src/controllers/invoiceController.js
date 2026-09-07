import { extractTextFromPdf } from "../services/pdfService.js";

/**
 * Invoice controller — Phase 3.
 *
 * Handles the uploaded PDF: validates, extracts raw text, and returns it.
 * AI invoice extraction and accounting sync will be added in later phases.
 */

/**
 * POST /api/invoices/process
 *
 * 1. Confirm a file was provided.
 * 2. Validate PDF magic bytes (%PDF-) from the buffer.
 * 3. Extract text from the PDF using pdfService.
 * 4. Validate that meaningful text was extracted.
 * 5. Return success response with file metadata and extracted text.
 */
export async function processInvoice(req, res, next) {
  try {
    // 1. Check that a file was uploaded
    if (!req.file) {
      const error = new Error("No invoice PDF was uploaded");
      error.statusCode = 400;
      return next(error);
    }

    // 2. Validate PDF magic bytes from the actual buffer
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
      `[INVOICE] Processing PDF: ${req.file.originalname} (${req.file.size} bytes)`,
    );
    const extractedText = await extractTextFromPdf(buffer);

    // 4. Validate that meaningful text was found
    if (!extractedText || extractedText.length === 0) {
      const error = new Error("No extractable text was found in the PDF");
      error.statusCode = 422;
      return next(error);
    }

    console.log(
      `[INVOICE] Successfully extracted ${extractedText.length} characters from ${req.file.originalname}`,
    );

    // 5. Return success with file metadata and extracted raw text
    res.status(200).json({
      success: true,
      message: "Invoice text extracted successfully",
      file: {
        originalName: req.file.originalname,
      },
      text: extractedText,
    });
  } catch (err) {
    next(err);
  }
}
