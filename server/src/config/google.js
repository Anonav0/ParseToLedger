import { google } from "googleapis";
import env from "./env.js";

/**
 * Minimum required Google API scope for spreadsheet reading and appending.
 */
export const GOOGLE_SHEETS_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
];

/**
 * Validates Google Sheets configuration and initializes the Google Sheets API client.
 *
 * @returns {google.sheets_v4.Sheets} Authenticated Google Sheets client
 * @throws {Error} If required environment variables are missing
 */
export function getGoogleSheetsClient() {
  const missing = [];
  if (!env.GOOGLE_CLIENT_EMAIL) missing.push("GOOGLE_CLIENT_EMAIL");
  if (!env.GOOGLE_PRIVATE_KEY) missing.push("GOOGLE_PRIVATE_KEY");
  if (!env.GOOGLE_SPREADSHEET_ID) missing.push("GOOGLE_SPREADSHEET_ID");

  if (missing.length > 0) {
    const error = new Error(
      `Google Sheets configuration is incomplete. Missing: ${missing.join(", ")}. Please update server/.env.`,
    );
    error.statusCode = 500;
    throw error;
  }

  const auth = new google.auth.JWT({
    email: env.GOOGLE_CLIENT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY,
    scopes: GOOGLE_SHEETS_SCOPES,
  });

  return google.sheets({ version: "v4", auth });
}
