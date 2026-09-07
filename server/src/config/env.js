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
 * Validate that required environment variables are properly configured.
 * Enforces fail-fast in production and logs safe operational status in development.
 * Never prints secret values to stdout or logs.
 */
export function validateEnv() {
  const isProduction = env.NODE_ENV === "production";
  const missingCritical = [];

  // Core Server Configuration
  if (!env.PORT || isNaN(env.PORT) || env.PORT <= 0) {
    missingCritical.push("PORT (must be a positive integer)");
  }
  if (!env.CLIENT_URL) {
    missingCritical.push("CLIENT_URL (frontend origin for CORS)");
  }

  // LLM Configuration
  const isLlmConfigured = Boolean(env.LLM_API_KEY);
  if (!isLlmConfigured) {
    if (isProduction) {
      missingCritical.push("LLM_API_KEY (required for AI invoice extraction)");
    } else {
      console.warn(
        "[CONFIG WARNING] LLM_API_KEY is not configured in server/.env. " +
          "AI invoice extraction will return an error until set.",
      );
    }
  }

  // Google Sheets ERP Configuration
  const missingSheets = [];
  if (!env.GOOGLE_CLIENT_EMAIL) missingSheets.push("GOOGLE_CLIENT_EMAIL");
  if (!env.GOOGLE_PRIVATE_KEY) missingSheets.push("GOOGLE_PRIVATE_KEY");
  if (!env.GOOGLE_SPREADSHEET_ID) missingSheets.push("GOOGLE_SPREADSHEET_ID");

  const isSheetsConfigured = missingSheets.length === 0;
  if (!isSheetsConfigured) {
    if (isProduction) {
      missingCritical.push(...missingSheets);
    } else {
      console.warn(
        `[CONFIG WARNING] Google Sheets integration is missing: ${missingSheets.join(
          ", ",
        )}. Google Sheets sync will return an error until configured.`,
      );
    }
  }

  // Fail fast in production if required variables are missing
  if (missingCritical.length > 0) {
    const errorMsg = `[FATAL] Startup failed due to missing required environment configuration: ${missingCritical.join(
      ", ",
    )}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Operational status report (zero secrets logged)
  console.log(
    `[CONFIG] Environment: ${env.NODE_ENV} | Port: ${env.PORT} | CORS Origin: ${env.CLIENT_URL}`,
  );
  console.log(
    `[CONFIG] LLM Service: ${
      isLlmConfigured
        ? `Configured (model: ${env.LLM_MODEL})`
        : "Disabled / Not Configured"
    }`,
  );
  console.log(
    `[CONFIG] Google Sheets: ${
      isSheetsConfigured
        ? `Configured (sheet: '${env.GOOGLE_SHEET_NAME}')`
        : "Disabled / Not Configured"
    }`,
  );
}

export default env;
