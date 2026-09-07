import multer from "multer";
import env from "../config/env.js";

/**
 * Multer upload middleware.
 *
 * - Uses memory storage (no files saved to disk).
 * - Accepts a single file on the "file" field.
 * - Restricts to PDF MIME type.
 * - Enforces configurable file-size limit from MAX_FILE_SIZE_MB.
 */

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    const error = new Error("Only PDF files are allowed");
    error.statusCode = 400;
    cb(error, false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});

/**
 * Middleware that handles a single PDF upload on the "file" field.
 */
export const uploadSingle = upload.single("file");
