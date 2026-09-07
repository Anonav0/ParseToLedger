import express from "express";
import cors from "cors";
import env from "./config/env.js";
import { requestLogger } from "./middleware/loggerMiddleware.js";
import healthRoutes from "./routes/healthRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

// ---------------------------------------------------------------------------
// Operational Middleware
// ---------------------------------------------------------------------------

// Lightweight structured request logging
app.use(requestLogger);

// Parse JSON request bodies
app.use(express.json());

// Configure CORS strictly using CLIENT_URL
const allowedOrigins = [env.CLIENT_URL];
if (env.NODE_ENV !== "production") {
  if (!allowedOrigins.includes("http://localhost:5173")) {
    allowedOrigins.push("http://localhost:5173");
  }
  if (!allowedOrigins.includes("http://127.0.0.1:5173")) {
    allowedOrigins.push("http://127.0.0.1:5173");
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, test suites, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const corsError = new Error(
        `CORS policy: Origin ${origin} is not authorized to access this resource`,
      );
      corsError.statusCode = 403;
      return callback(corsError);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use("/api", healthRoutes);
app.use("/api", invoiceRoutes);

// ---------------------------------------------------------------------------
// Error handling (registered after routes)
// ---------------------------------------------------------------------------

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
