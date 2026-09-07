/**
 * Invoice controller — Phase 2.
 *
 * Handles the uploaded PDF: validates and returns metadata.
 * PDF text extraction will be added in a later phase.
 */

/**
 * POST /api/invoices/process
 *
 * 1. Confirm a file was provided.
 * 2. Validate PDF magic bytes (%PDF-) from the buffer.
 * 3. Return file metadata.
 */
export function processInvoice(req, res, next) {
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

    // 3. Return success with file metadata
    console.log(
      `[INVOICE] Uploaded: ${req.file.originalname} (${req.file.size} bytes)`,
    );

    res.status(200).json({
      success: true,
      message: "Invoice uploaded successfully",
      file: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (err) {
    next(err);
  }
}
