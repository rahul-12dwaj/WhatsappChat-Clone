const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default async function loadChats(userId) {
  if (!userId) return [];

  // Timeout controller for fetch request (10 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${BACKEND_URL}/api/chats?userId=${userId}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to load chats: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Basic validation to ensure data is an array
    if (!Array.isArray(data)) {
      console.warn("loadChats: Expected array but received:", data);
      return [];
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("loadChats: Request timed out");
    } else {
      console.error("loadChats: Error loading chats:", error);
    }
    return [];
  }
}
