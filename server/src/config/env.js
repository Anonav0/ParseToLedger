import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../../.env") });

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10,
};

/**
 * Validate that required environment variables are present.
 * In Phase 1 there are no strictly required secrets, but this
 * function will be extended in later phases (e.g. LLM key, Google creds).
 */
export function validateEnv() {
  const missing = [];

  // No required vars in Phase 1 — placeholder for future phases
  // Example: if (!process.env.LLM_API_KEY) missing.push('LLM_API_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "See .env.example for the required configuration.",
    );
  }
}

export default env;
