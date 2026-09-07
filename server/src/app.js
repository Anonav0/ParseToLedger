import express from "express";
import cors from "cors";
import env from "./config/env.js";
import healthRoutes from "./routes/healthRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Parse JSON request bodies
app.use(express.json());

// Configure CORS — allow requests from the React frontend
app.use(
  cors({
    origin: env.CLIENT_URL,
    methods: ["GET", "POST"],
  }),
);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use("/api", healthRoutes);

// ---------------------------------------------------------------------------
// Error handling (must be registered after routes)
// ---------------------------------------------------------------------------

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
