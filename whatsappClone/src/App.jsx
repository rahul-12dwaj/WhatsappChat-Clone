import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import loadChats from "./loadChats";
import EmptyState from "./components/EmptyState";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const socket = io(BACKEND_URL, { autoConnect: true });

function App() {
  const [testUsers, setTestUsers] = useState([]);
  const [userId, setUserId] = useState(() => localStorage.getItem("wa_id") || null);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [activeTab, setActiveTab] = useState("chats");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/users`);
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
        const users = await res.json();
        setTestUsers(users);

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

  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      try {
        const data = await loadChats(userId);
        const chatsWithExtras = data.map((chat) => {
          const lastMsg = chat.messages?.[chat.messages.length - 1] || {};
          return {
            ...chat,
            otherUserWaId: chat.id,
            otherUserName: testUsers.find((u) => u.wa_id === chat.id)?.name || "Unknown",
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

    const handleConnect = () => {
      console.log("🔌 Socket connected:", socket.id);
      socket.emit("register", userId);
    };

    const handleNewMessage = (msg) => {
      if (msg.wa_id === userId || msg.to === userId) {
        const chatPartnerId = msg.wa_id === userId ? msg.to : msg.wa_id;

        setChats((prevChats) => {
          const idx = prevChats.findIndex((c) => c.id === chatPartnerId);
          if (idx === -1) {
            return [
              {
                id: chatPartnerId,
                otherUserWaId: chatPartnerId,
                otherUserName:
                  testUsers.find((u) => u.wa_id === chatPartnerId)?.name || "Unknown",
                avatar: "/default-avatar.png",
                messages: [msg],
                lastMessage: msg.text,
                time: msg.time,
                status: msg.status,
              },
              ...prevChats,
            ];
          } else {
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

    socket.on("connect", handleConnect);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("newMessage", handleNewMessage);
    };
  }, [userId, testUsers]);

  const sortedChats = [...chats].sort((a, b) => {
    const timeA = a.messages[a.messages.length - 1]?.timestamp || 0;
    const timeB = b.messages[b.messages.length - 1]?.timestamp || 0;
    return timeB - timeA;
  });

  const selectedChat = sortedChats.find((chat) => chat.id === selectedChatId);

  const handleSendMessage = useCallback((chatId, newMessage) => {
    const msgObj = { ...newMessage, to: chatId };
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage.text,
              time:
                newMessage.time ||
                new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: newMessage.status || "sent",
            }
          : chat
      )
    );
    socket.emit("sendMessage", msgObj);
  }, []);

  const toggleUser = () => {
    if (testUsers.length < 2) return;
    setUserId((prev) => {
      const idx = testUsers.findIndex((user) => user.wa_id === prev);
      const nextId = testUsers[(idx + 1) % testUsers.length].wa_id;
      localStorage.setItem("wa_id", nextId);
      return nextId;
    });
    setSelectedChatId(null);
    setChats([]);
  };

  const currentUserName =
    testUsers.find((user) => user.wa_id === userId)?.name || "Loading...";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#111b21] text-white">
      <header className="p-4 bg-[#111b21] text-white flex justify-between items-center flex-shrink-0 border-none">
        <div className="flex items-center gap-3">
          <img src="/whatsapp.png" alt="WhatsApp" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold">WhatsApp</h1>
        </div>

        <button
          onClick={toggleUser}
          disabled={testUsers.length < 2}
          className={`px-3 py-1 rounded flex items-center justify-center gap-2 ${
            testUsers.length < 2
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-[#005c4b] hover:bg-green-700"
          }`}
        >
          {/* Mobile: show icon only */}
          <img
            src="/interaction.png"
            alt="Switch User"
            className="w-6 h-6 block sm:hidden"
          />

          {/* Desktop: show text only */}
          <span className="hidden sm:block text-sm font-medium">
            Switch User (Current: {currentUserName})
          </span>
        </button>
      </header>

      <div className="flex flex-grow overflow-hidden w-full min-h-0">
        {/* Desktop Sidebar (visible on sm and above) */}
        <div className="hidden sm:flex flex-shrink-0 min-h-0">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Main content area */}
        <div className="flex flex-grow overflow-hidden w-full min-h-0 border-t border-[#222D32]">
          {/* Desktop: ChatList */}
          <div className="hidden sm:flex w-1/3 border-r border-l border-gray-700 bg-gray-700 min-h-0 overflow-y-auto">
            <ChatList
              chats={sortedChats}
              onSelectChat={setSelectedChatId}
              selectedChatId={selectedChatId}
              userId={userId}
            />
          </div>

          {/* Desktop: ChatWindow */}
          <div className="hidden sm:flex w-2/3 flex flex-col bg-[#111b21] min-h-0">
            {selectedChat ? (
              <div className="flex flex-col flex-grow overflow-hidden min-h-0">
                <ChatWindow
                  chat={selectedChat}
                  onBack={() => setSelectedChatId(null)}
                  onSendMessage={handleSendMessage}
                  userId={userId}
                />
              </div>
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Mobile view */}
          {/* If no chat selected => show sidebar + chat list */}
          {!selectedChatId && (
            <div className="w-full sm:hidden flex flex-col min-h-0">
              <div className="flex h-full overflow-hidden min-h-0">
                {/* Sidebar */}
                <div className="flex-shrink-0 bg-[#111b21] border-r border-gray-700 shadow-md min-h-0">
                  <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
                {/* ChatList */}
                <div className="flex-grow w-full overflow-y-auto bg-[#111b21] min-h-0">
                  <ChatList
                    chats={sortedChats}
                    onSelectChat={setSelectedChatId}
                    selectedChatId={selectedChatId}
                    userId={userId}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mobile: If chat selected => show only chat window */}
          {selectedChatId && (
            <div className="sm:hidden flex-grow w-full h-full min-h-0 flex flex-col">
              <ChatWindow
                chat={selectedChat}
                onBack={() => setSelectedChatId(null)}
                onSendMessage={handleSendMessage}
                userId={userId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
