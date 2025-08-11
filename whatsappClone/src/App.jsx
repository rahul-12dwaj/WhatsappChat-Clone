import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import loadChats from "./loadChats";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const socket = io(BACKEND_URL, { autoConnect: true });

function App() {
  const [testUsers, setTestUsers] = useState([]);
  const [userId, setUserId] = useState(() => localStorage.getItem("wa_id") || null);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  // Fetch users once
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/users`);
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
        const users = await res.json();
        setTestUsers(users);

        // Auto-select first user if none stored
        if (!userId && users.length > 0) {
          const firstUser = users[0].wa_id;
          setUserId(firstUser);
          localStorage.setItem("wa_id", firstUser);
        }
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    }
    fetchUsers();
  }, []);

  // Load chats & setup socket only when userId changes
  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      try {
        const data = await loadChats(userId);
        const chatsWithExtras = data.map(chat => {
          const lastMsg = chat.messages?.[chat.messages.length - 1] || {};
          return {
            ...chat,
            otherUserWaId: chat.id,
            otherUserName: testUsers.find(u => u.wa_id === chat.id)?.name || "Unknown",
            messages: chat.messages || [],
            lastMessage: lastMsg.text || "",
            time: lastMsg.time || "",
            status: lastMsg.status || "",
          };
        });
        setChats(chatsWithExtras);
      } catch (error) {
        console.error("Failed to load chats:", error);
      }
    };

    fetchChats();
    setSelectedChatId(null);

    // Socket: register on connect
    const handleConnect = () => {
      console.log("🔌 Socket connected:", socket.id);
      socket.emit("register", userId);
    };

    // Socket: handle incoming message
    const handleNewMessage = (msg) => {
      if (msg.wa_id === userId || msg.to === userId) {
        const chatPartnerId = msg.wa_id === userId ? msg.to : msg.wa_id;

        setChats(prevChats => {
          const idx = prevChats.findIndex(c => c.id === chatPartnerId);
          if (idx === -1) {
            // New chat
            return [{
              id: chatPartnerId,
              otherUserWaId: chatPartnerId,
              otherUserName: testUsers.find(u => u.wa_id === chatPartnerId)?.name || "Unknown",
              avatar: "/default-avatar.png",
              messages: [msg],
              lastMessage: msg.text,
              time: msg.time,
              status: msg.status,
            }, ...prevChats];
          } else {
            // Existing chat
            const updatedChat = { ...prevChats[idx] };
            updatedChat.messages = [...updatedChat.messages, msg];
            updatedChat.lastMessage = msg.text;
            updatedChat.time = msg.time;
            updatedChat.status = msg.status;
            const newChats = prevChats.filter((_, i) => i !== idx);
            return [updatedChat, ...newChats];
          }
        });
      }
    };

    // Attach listeners once
    socket.on("connect", handleConnect);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("newMessage", handleNewMessage);
    };
  }, [userId, testUsers]);

  // Sort chats by latest timestamp
  const sortedChats = [...chats].sort((a, b) => {
    const timeA = a.messages[a.messages.length - 1]?.timestamp || 0;
    const timeB = b.messages[b.messages.length - 1]?.timestamp || 0;
    return timeB - timeA;
  });

  const selectedChat = sortedChats.find(chat => chat.id === selectedChatId);

  const handleSendMessage = useCallback((chatId, newMessage) => {
    const msgObj = { ...newMessage, to: chatId };

    // Optimistic UI update
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage.text,
              time: newMessage.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: newMessage.status || "sent",
            }
          : chat
      )
    );

    socket.emit("sendMessage", msgObj);
  }, []);

  const toggleUser = () => {
    if (testUsers.length < 2) return;
    setUserId(prev => {
      const idx = testUsers.findIndex(user => user.wa_id === prev);
      const nextId = testUsers[(idx + 1) % testUsers.length].wa_id;
      localStorage.setItem("wa_id", nextId);
      return nextId;
    });
    setSelectedChatId(null);
    setChats([]);
  };

  const currentUserName = testUsers.find(user => user.wa_id === userId)?.name || "Loading...";

  

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="p-4 bg-gray-800 text-white flex justify-between items-center flex-shrink-0">
        <h1 className="text-xl font-bold">WhatsApp Clone - Test Mode</h1>
        <button
          onClick={toggleUser}
          disabled={testUsers.length < 2}
          className={`px-3 py-1 rounded ${testUsers.length < 2 ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
        >
          Switch User (Current: {currentUserName})
        </button>
      </header>

      <div className="flex flex-grow overflow-hidden">
        <div className="hidden sm:flex w-full">
          <div className="w-1/3 border-r border-gray-300 overflow-y-auto">
            <ChatList chats={sortedChats} onSelectChat={setSelectedChatId} selectedChatId={selectedChatId} userId={userId} />
          </div>
          <div className="w-2/3 flex items-center justify-center bg-gray-50">
            {selectedChat ? (
              <div className="w-full max-h-full flex flex-col overflow-hidden h-screen">
                <ChatWindow chat={selectedChat} onBack={() => setSelectedChatId(null)} onSendMessage={handleSendMessage} userId={userId} />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a chat to start messaging
              </div>
            )}
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex sm:hidden w-full h-full overflow-hidden">
          {!selectedChatId ? (
            <div className="w-full h-full overflow-y-auto">
              <ChatList chats={sortedChats} onSelectChat={setSelectedChatId} selectedChatId={selectedChatId} userId={userId} />
            </div>
          ) : (
            <div className="w-full flex items-center justify-center h-full bg-gray-50">
              <div className="w-full max-h-full flex flex-col overflow-hidden">
                <ChatWindow chat={selectedChat} onBack={() => setSelectedChatId(null)} onSendMessage={handleSendMessage} userId={userId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
