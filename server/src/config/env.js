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
  LLM_API_KEY: process.env.LLM_API_KEY || "",
  LLM_MODEL: process.env.LLM_MODEL || "gemini-2.5-flash",
  // Google Sheets ERP Configuration
  GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID || "",
  GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL || "",
  GOOGLE_PRIVATE_KEY: (process.env.GOOGLE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  ),
  GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID || "",
  GOOGLE_SHEET_NAME: process.env.GOOGLE_SHEET_NAME || "Sheet1",
};

/**
 * Validate that required environment variables are present.
 */
export function validateEnv() {
  if (!env.LLM_API_KEY) {
    console.warn(
      "[CONFIG WARNING] LLM_API_KEY is not configured in server/.env. " +
        "AI invoice extraction will fail with a configuration error until set.",
    );
  }

  if (
    !env.GOOGLE_CLIENT_EMAIL ||
    !env.GOOGLE_PRIVATE_KEY ||
    !env.GOOGLE_SPREADSHEET_ID
  ) {
    console.warn(
      "[CONFIG WARNING] Google Sheets credentials are not fully configured in server/.env. " +
        "Google Sheets sync will fail with a configuration error until set.",
    );
  }
}

export default env;
