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
