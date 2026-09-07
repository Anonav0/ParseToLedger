import multer from "multer";
import env from "../config/env.js";

/**
 * Centralized Express error handler.
 *
 * Catches all errors passed via next(err) and returns a consistent
 * JSON response. Stack traces are never exposed to the client.
 *
 * Includes special handling for Multer upload errors.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Handle Multer-specific errors
  if (err instanceof multer.MulterError) {
    let message = "File upload error";
    let statusCode = 400;

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = `File size exceeds the ${env.MAX_FILE_SIZE_MB} MB limit`;
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field";
        break;
      default:
        message = `Upload error: ${err.message}`;
    }

    console.error(`[UPLOAD ERROR] ${err.code} — ${message}`);
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  // Log the full error on the server for debugging
  console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${message}`);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

/**
 * Handle 404 — unknown routes.
 */
export function notFoundHandler(req, res, next) {
  const error = new Error(`Not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}
