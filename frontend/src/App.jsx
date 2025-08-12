import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import EmptyState from "./components/EmptyState";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const BUSINESS_NUMBER = import.meta.env.VITE_BUSINESS_PHONE_NUMBER;
const socket = io(BACKEND_URL, { autoConnect: true });

function App() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [activeTab, setActiveTab] = useState("chats");

  // Fetch conversations
  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/conversations`);
        if (!res.ok) throw new Error(`Failed to fetch conversations: ${res.status}`);
        const conversations = await res.json();

        const chatsData = conversations.map((c) => ({
          id: c.wa_id,
          otherUserWaId: c.wa_id,
          otherUserName: c.lastMessage?.name || "Unknown",
          messages: c.lastMessage ? [c.lastMessage] : [],
          lastMessage: c.lastMessage?.text || "",
          time: c.lastMessage?.timestamp || "",
          status: c.lastMessage?.status || "",
        }));

        setChats(chatsData);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    }
    fetchConversations();
  }, []);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChatId) return;
    async function fetchMessages() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/messages/${selectedChatId}`);
        if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
        const msgs = await res.json();
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === selectedChatId ? { ...chat, messages: msgs } : chat
          )
        );
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    }
    fetchMessages();
  }, [selectedChatId]);

  // WebSocket
  useEffect(() => {
    const handleConnect = () => {
      console.log("🔌 Socket connected");
    };

    const normalizeId = (id) => String(id).replace(/^\+/, "").trim();

    const handleNewMessage = (msg) => {
      const chatPartnerId = normalizeId(
        msg.wa_id === BUSINESS_NUMBER ? msg.to : msg.wa_id
      );

      setChats((prevChats) => {
        const idx = prevChats.findIndex(
          (c) => normalizeId(c.id) === chatPartnerId
        );

        if (idx !== -1) {
          const updatedChat = { ...prevChats[idx] };
          updatedChat.messages = [...(updatedChat.messages || []), msg];
          updatedChat.lastMessage = msg.text;
          updatedChat.time = msg.timestamp;
          updatedChat.status = msg.status;

          const newChats = prevChats.filter((_, i) => i !== idx);
          return [updatedChat, ...newChats];
        }

        return [
          {
            id: chatPartnerId,
            otherUserWaId: chatPartnerId,
            otherUserName: msg.name || msg.contact?.name || "Unknown",
            messages: [msg],
            lastMessage: msg.text,
            time: msg.timestamp,
            status: msg.status,
          },
          ...prevChats,
        ];
      });
    };

    socket.on("connect", handleConnect);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("newMessage", handleNewMessage);
    };
  }, []);

  // Sort chats
  const sortedChats = [...chats].sort((a, b) => {
    const timeA = new Date(a.time).getTime() || 0;
    const timeB = new Date(b.time).getTime() || 0;
    return timeB - timeA;
  });

  const selectedChat = sortedChats.find((chat) => chat.id === selectedChatId);

  // Send message
  const handleSendMessage = useCallback((chatId, newMessage) => {
    const msgObj = { ...newMessage, to: chatId };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage.text,
              time: newMessage.timestamp || new Date().toISOString(),
              status: newMessage.status || "sent",
            }
          : chat
      )
    );

    socket.emit("sendMessage", msgObj);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1d1f1f] text-white">
      {/* Header */}
      <header className="p-3 bg-[#161717] text-white flex justify-between items-center flex-shrink-0 border-none">
        <div className="flex items-center gap-2">
          <img src="/whatsapp.png" alt="WhatsApp" className="w-6 h-6 object-contain" />
          <h1 className="text-lg font-bold">WhatsApp</h1>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden w-full min-h-0">
        {/* Sidebar (Desktop only) */}
        <div className="hidden sm:flex flex-shrink-0 min-h-0">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Main area */}
        <div className="flex flex-grow overflow-hidden w-full min-h-0 border-t border-[#222D32]">
          {/* Chat List (Desktop) */}
          <div className="hidden sm:flex w-1/3 border-r border-l border-gray-700 bg-gray-700 min-h-0 overflow-y-auto">
            <ChatList
              chats={sortedChats}
              onSelectChat={setSelectedChatId}
              selectedChatId={selectedChatId}
            />
          </div>

          {/* Chat Window (Desktop) */}
          <div className="hidden sm:flex w-2/3 flex flex-col bg-[#111b21] min-h-0">
            {selectedChat ? (
              <ChatWindow
                chat={selectedChat}
                onBack={() => setSelectedChatId(null)}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Mobile - Chat List (No sidebar) */}
          {!selectedChatId && (
            <div className="w-full sm:hidden flex flex-col min-h-0">
              <div className="flex-grow w-full overflow-y-auto bg-[#161717] min-h-0">
                <ChatList
                  chats={sortedChats}
                  onSelectChat={setSelectedChatId}
                  selectedChatId={selectedChatId}
                />
              </div>
            </div>
          )}

          {/* Mobile - Chat Window */}
          {selectedChatId && (
            <div className="sm:hidden flex-grow w-full h-full min-h-0 flex flex-col">
              <ChatWindow
                chat={selectedChat}
                onBack={() => setSelectedChatId(null)}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
