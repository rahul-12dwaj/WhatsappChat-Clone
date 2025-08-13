import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import EmptyState from "./components/EmptyState";
import StatusList from "./components/StatusList";
import CommunityTab from "./components/CommunityTab";
import ChannelList from "./components/ChannelList";
import ChannelListEmptyState from "./components/ChannelListEmptyState";
import CommunityTabEmptyState from "./components/CommunityTabEmptyState";
import StatusListEmptyState from "./components/StatusListEmptyState";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const BUSINESS_NUMBER = import.meta.env.VITE_BUSINESS_PHONE_NUMBER;
const socket = io(BACKEND_URL, { autoConnect: true });

function App() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [activeTab, setActiveTab] = useState("chats");

  const [channels, setChannels] = useState([]);
  const [communities, setCommunities] = useState([]);

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

  // WebSocket handlers
  useEffect(() => {
    const normalizeId = (id) => String(id).replace(/^\+/, "").trim();

    const handleNewMessage = (msg) => {
      const chatPartnerId = normalizeId(
        msg.wa_id === BUSINESS_NUMBER ? msg.to : msg.wa_id
      );

      setChats((prevChats) => {
        const idx = prevChats.findIndex((c) => normalizeId(c.id) === chatPartnerId);

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

    const handleConnect = () => console.log("🔌 Socket connected");

    socket.on("connect", handleConnect);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("newMessage", handleNewMessage);
    };
  }, []);

  // Sort chats by last message time desc
  const sortedChats = [...chats].sort((a, b) => {
    const timeA = new Date(a.time).getTime() || 0;
    const timeB = new Date(b.time).getTime() || 0;
    return timeB - timeA;
  });

  const selectedChat = sortedChats.find((chat) => chat.id === selectedChatId);

  // Send message handler
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

  // Render content based on activeTab & screen size (desktop/mobile)
  const renderContent = () => {
    switch (activeTab) {
      case "chats":
        if (sortedChats.length === 0) return <EmptyState />;

        return (
          <>
            {/* Chat List */}
            <div className="hidden sm:flex w-1/3 border-r border-l border-gray-700 bg-gray-700 min-h-0 overflow-hindden">
              <ChatList
                chats={sortedChats}
                onSelectChat={setSelectedChatId}
                selectedChatId={selectedChatId}
              />
            </div>

            {/* Chat Window */}
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

            {/* Mobile Chat List */}
            {!selectedChatId && (
              <div className="sm:hidden w-full flex flex-col min-h-0">
                <div className="flex-grow w-full overflow-y-auto bg-[#161717] min-h-0">
                  <ChatList
                    chats={sortedChats}
                    onSelectChat={setSelectedChatId}
                    selectedChatId={selectedChatId}
                  />
                </div>
              </div>
            )}

            {/* Mobile Chat Window */}
            {selectedChatId && (
              <div className="sm:hidden flex-grow w-full h-full min-h-0 flex flex-col">
                <ChatWindow
                  chat={selectedChat}
                  onBack={() => setSelectedChatId(null)}
                  onSendMessage={handleSendMessage}
                />
              </div>
            )}
          </>
        );

      case "status":
        if (channels.length === 0) {
          return (
            <>
              {/* Desktop */}
              <div className="hidden sm:flex w-1/3 border-r border-l border-gray-700 bg-gray-700 min-h-0 overflow-y-auto">
                <StatusList channels={channels} />
              </div>
              <div className="hidden sm:flex w-2/3 flex flex-col bg-[#111b21] min-h-0">
                <StatusListEmptyState />
              </div>

              {/* Mobile */}
              <div className="sm:hidden flex flex-col w-full min-h-0">
                <div className="flex-grow overflow-y-auto bg-[#161717] min-h-0">
                  <StatusList channels={channels} />
                </div>
                <div className="hidden" /> {/* Hide empty state on mobile */}
              </div>
            </>
          );
        }
        return (
          <>
            {/* Desktop */}
            <div className="hidden sm:flex w-1/3 border-r border-l border-gray-700 bg-gray-700 min-h-0 overflow-y-auto">
              <StatusList channels={channels} />
            </div>
            {/* Mobile */}
            <div className="sm:hidden w-full flex flex-col min-h-0">
              <StatusList channels={channels} />
            </div>
          </>
        );

      case "channels":
        if (channels.length === 0) {
          return (
            <>
              {/* Desktop */}
              <div className="hidden sm:flex w-1/3 border-r border-l border-gray-700 bg-gray-700 min-h-0 overflow-y-auto">
                <ChannelList channels={channels} />
              </div>
              <div className="hidden sm:flex w-2/3 flex flex-col bg-[#111b21] min-h-0">
                <ChannelListEmptyState />
              </div>

              {/* Mobile */}
              <div className="sm:hidden flex flex-col w-full min-h-0">
                <div className="flex-grow overflow-y-auto bg-[#161717] min-h-0">
                  <ChannelList channels={channels} />
                </div>
                <div className="hidden" /> {/* Hide empty state on mobile */}
              </div>
            </>
          );
        }
        return (
          <>
            {/* Desktop */}
            <div className="hidden sm:flex w-1/3 border-r border-l border-gray-700 bg-gray-700 min-h-0 overflow-y-auto">
              <ChannelList channels={channels} />
            </div>
            {/* Mobile */}
            <div className="sm:hidden w-full flex flex-col min-h-0">
              <ChannelList channels={channels} />
            </div>
          </>
        );

      case "communities":
        if (communities.length === 0) {
          return (
            <>
              {/* Desktop */}
              <div className="hidden sm:flex w-1/3 border-r border-l border-gray-700 bg-gray-700 min-h-0 overflow-y-auto">
                <CommunityTab communities={communities} />
              </div>
              <div className="hidden sm:flex w-2/3 flex flex-col bg-[#111b21] min-h-0">
                <CommunityTabEmptyState />
              </div>

              {/* Mobile */}
              <div className="sm:hidden flex flex-col w-full min-h-0">
                <div className="flex-grow overflow-y-auto bg-[#161717] min-h-0">
                  <CommunityTab communities={communities} />
                </div>
                <div className="hidden" /> {/* Hide empty state on mobile */}
              </div>
            </>
          );
        }
        return (
          <>
            {/* Desktop */}
            <div className="hidden sm:flex w-1/3 border-r border-l border-gray-700 bg-gray-700 min-h-0 overflow-y-auto">
              <CommunityTab communities={communities} />
            </div>
            {/* Mobile */}
            <div className="sm:hidden w-full flex flex-col min-h-0">
              <CommunityTab communities={communities} />
            </div>
          </>
        );

      case "settings":
        return (
          <div className="p-4 text-white">
            <h2 className="text-lg font-semibold mb-2">Settings</h2>
            <p>Settings content goes here.</p>
          </div>
        );

      case "profile":
        return (
          <div className="p-4 text-white">
            <h2 className="text-lg font-semibold mb-2">Profile</h2>
            <p>Profile content goes here.</p>
          </div>
        );

      default:
        return <EmptyState />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1d1f1f] text-white">
      <div className="flex flex-grow overflow-hidden w-full min-h-0">
        {/* Sidebar for desktop */}
        <div className="hidden sm:flex flex-shrink-0 min-h-0">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Sidebar for mobile (horizontal bottom bar) */}
        {!selectedChatId && (
          <div className="sm:hidden fixed bottom-0 w-full bg-[#111b21] border-t border-[#222D32] flex justify-around items-center h-14 z-50">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isHorizontal />
          </div>
        )}



        {/* Main content area */}
        <div
          className={`flex flex-grow overflow-hidden w-full min-h-0 border-t border-[#222D32] sm:pb-0 ${
            selectedChatId ? "" : "pb-14"
          }`}
        >
          {renderContent()}
        </div>

      </div>
    </div>
  );
}

export default App;
