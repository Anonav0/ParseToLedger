/**
 * Health check controller.
 */
export function getHealth(req, res) {
  res.status(200).json({
    success: true,
    message: "Invoice Accounting Sync API is running",
  });
}
