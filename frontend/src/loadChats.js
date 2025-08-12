const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Fetches the list of conversations (latest message per wa_id) from the backend.
 * @returns {Promise<Array>} - Array of conversation objects.
 */
export default async function loadChats() {
  // Setup a 10-second timeout for the request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${BACKEND_URL}/api/chats`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Failed to load chats: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Validate that we received an array
    if (!Array.isArray(data)) {
      console.warn("loadChats: Expected array but received:", data);
      return [];
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      console.error("loadChats: Request timed out");
    } else {
      console.error("loadChats: Error loading chats:", error);
    }

    return [];
  }
}
