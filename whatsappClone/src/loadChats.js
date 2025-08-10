// src/loadChats.js
export default async function loadChats() {
  try {
    const res = await fetch("http://localhost:5000/api/chats");
    if (!res.ok) {
      throw new Error(`Failed to load chats: ${res.statusText}`);
    }
    const data = await res.json();
    return data; // Already processed by backend
  } catch (err) {
    console.error("Error loading chats:", err);
    return [];
  }
}
