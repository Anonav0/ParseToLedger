const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Check whether the backend API is reachable.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    if (err.name === "TypeError" || err.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to the backend server. Please verify it is running.",
      );
    }
    throw err;
  }
}

/**
 * Helper to map HTTP status codes to clear, human-readable category messages.
 */
function getStatusMessage(status, serverMessage) {
  if (serverMessage) return serverMessage;

  switch (status) {
    case 400:
      return "Invalid request or unsupported file format. Please select a valid PDF invoice.";
    case 413:
      return "The uploaded invoice file exceeds the maximum file size limit (10 MB).";
    case 422:
      return "The invoice could not be parsed or failed accounting validation checks.";
    case 502:
      return "External service error (AI extraction or Google Sheets sync). Please try again.";
    case 500:
      return "An unexpected server error occurred while processing the invoice.";
    default:
      return "Unable to process the invoice. Please check the file and try again.";
  }
}

/**
 * Upload a PDF invoice for end-to-end processing and Google Sheets synchronization.
 *
 * @param {File} file - The PDF file to upload.
 * @returns {Promise<{success: boolean, message: string, invoice?: object, sync?: object, errors?: Array}>}
 */
export async function uploadInvoice(file) {
  const formData = new FormData();
  formData.append("file", file);

  let response;
  try {
    response = await fetch(`${API_URL}/api/invoices/process`, {
      method: "POST",
      body: formData,
      // Do NOT set Content-Type header — browser generates multipart/form-data boundary
    });
  } catch (netErr) {
    const error = new Error(
      "Network error: Unable to connect to the server. Please ensure the backend is running.",
    );
    error.status = 0;
    error.isNetworkError = true;
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    const error = new Error(
      "Unexpected server response format. Please try again later.",
    );
    error.status = response.status;
    throw error;
  }

  if (!response.ok || !data.success) {
    // If the server validated the invoice but Google Sheets sync failed:
    // Return data so the UI can display the validated invoice and sync failure banner
    if (data.invoice && data.sync) {
      return data;
    }

    const message = getStatusMessage(response.status, data.message);
    const error = new Error(message);
    error.status = response.status;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      error.errors = data.errors;
    }
    throw error;
  }

  return data;
}
