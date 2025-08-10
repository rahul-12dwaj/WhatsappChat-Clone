// src/loadChats.js
export default async function loadChats() {
  try {
    const res = await fetch("https://whatsappchat-production-8347.up.railway.app/api/chats");
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
