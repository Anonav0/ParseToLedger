import multer from "multer";
import env from "../config/env.js";

/**
 * Centralized Express error handler.
 *
 * Catches all errors passed via next(err) and returns a consistent
 * JSON response. Stack traces are never exposed to the client.
 *
 * Includes handling for:
 * - Multer upload errors
 * - Structured validation errors (err.errors)
 * - General HTTP errors
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // 1. Handle Multer-specific errors
  if (err instanceof multer.MulterError) {
    let message = "File upload error";
    let statusCode = 400;

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = `File size exceeds the ${env.MAX_FILE_SIZE_MB} MB limit`;
        statusCode = 413;
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field";
        statusCode = 400;
        break;
      default:
        message = `Upload error: ${err.message}`;
        statusCode = 400;
    }

    console.error(`[UPLOAD ERROR] ${err.code} — ${message}`);
    return res.status(statusCode).json({
      success: false,
      message,
      errors: [],
    });
  }

  const isUnexpected = !err.statusCode || err.statusCode >= 500;
  const statusCode = err.statusCode || 500;

  // Sanitize message for unexpected 500 errors in production
  let clientMessage = err.message || "Something went wrong";
  if (isUnexpected && process.env.NODE_ENV === "production") {
    clientMessage =
      "An unexpected server error occurred. Please try again later.";
  }

  // Log on the server (zero secrets logged)
  console.error(
    `[ERROR] ${req.method} ${req.originalUrl} ${statusCode} — ${err.message || clientMessage}`,
  );
  if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
    console.error(`[ERROR DETAILS] ${JSON.stringify(err.errors)}`);
  }
  if (isUnexpected && process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  const responseBody = {
    success: false,
    message: clientMessage,
  };

  // Attach structured field-level errors if present
  if (Array.isArray(err.errors) && err.errors.length > 0) {
    responseBody.errors = err.errors;
  }

  res.status(statusCode).json(responseBody);
}

/**
 * Handle 404 — unknown routes.
 */
export function notFoundHandler(req, res, next) {
  const error = new Error(`Not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}
