const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default async function loadChats(userId) {
  if (!userId) return [];

  // Optional: set a timeout for fetch (e.g., 10 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${BACKEND_URL}/api/chats?userId=${userId}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Failed to load chats: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // Optional: Basic validation (ensure it's an array)
    if (!Array.isArray(data)) {
      console.warn("loadChats: Response data is not an array", data);
      return [];
    }

    // Optional: you can validate chat structure here if needed

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("loadChats: Fetch aborted due to timeout");
    } else {
      console.error("Error loading chats:", err);
    }
    return [];
  }
}
