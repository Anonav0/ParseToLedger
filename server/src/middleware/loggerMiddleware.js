/**
 * Lightweight HTTP request logging middleware.
 *
 * Logs operational metrics: Method, Path, Status Code, and Latency (ms).
 * Never logs request bodies, credentials, private keys, or raw payloads.
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;

    console.log(`[HTTP] ${method} ${url} ${status} (${duration}ms)`);
  });

  next();
}

export default requestLogger;
