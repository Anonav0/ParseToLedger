const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Check whether the backend API is reachable.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function checkHealth() {
  const response = await fetch(`${API_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Upload a PDF invoice for processing.
 * @param {File} file - The PDF file to upload.
 * @returns {Promise<{success: boolean, message: string, invoice?: object, sync?: object, errors?: Array}>}
 */
export async function uploadInvoice(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/invoices/process`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type — let the browser set the multipart boundary
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    // If the server returned a validated invoice despite sync failure, return it
    // so the UI can display the invoice along with the sync failure notice.
    if (data.invoice && data.sync) {
      return data;
    }

    const error = new Error(
      data.message || "Unable to process the invoice. Please try again.",
    );
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      error.errors = data.errors;
    }
    throw error;
  }

  return data;
}
