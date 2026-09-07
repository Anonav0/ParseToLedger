/**
 * Centralized Express error handler.
 *
 * Catches all errors passed via next(err) and returns a consistent
 * JSON response. Stack traces are never exposed to the client.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
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
