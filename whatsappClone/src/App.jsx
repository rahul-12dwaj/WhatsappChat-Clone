import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import loadChats from "./loadChats";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const socket = io(BACKEND_URL);

function App() {
  const [testUsers, setTestUsers] = useState([]); // [{ wa_id, name }]
  const [userId, setUserId] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  // Fetch users once on mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/users`);
        if (!res.ok) {
          console.error("Failed to fetch users:", res.status);
          return;
        }
        const users = await res.json();
        setTestUsers(users);
        if (users.length > 0) setUserId(users[0].wa_id);
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    }
    fetchUsers();
  }, []);

  // Load chats & setup socket listeners when userId or testUsers change
  useEffect(() => {
    if (!userId) return;

    async function fetchChats() {
      try {
        const data = await loadChats(userId);
        const chatsWithNames = data.map((chat) => ({
          ...chat,
          otherUserWaId: chat.id,
          otherUserName:
            testUsers.find((u) => u.wa_id === chat.id)?.name || "Unknown",
          messages: chat.messages || [], // Ensure messages array exists
        }));
        setChats(chatsWithNames);
      } catch (error) {
        console.error("Failed to load chats:", error);
        setChats([]);
      }
    }

    fetchChats();
    setSelectedChatId(null);

    // Register user on socket
    socket.emit("register", userId);

    // Listen for new messages
    const handleNewMessage = (msg) => {
      if (msg.wa_id === userId || msg.to === userId) {
        const chatPartnerId = msg.wa_id === userId ? msg.to : msg.wa_id;

        setChats((prevChats) => {
          const chatIndex = prevChats.findIndex((c) => c.id === chatPartnerId);

          if (chatIndex === -1) {
            // New chat, add it at the top
            const newChat = {
              id: chatPartnerId,
              otherUserWaId: chatPartnerId,
              otherUserName:
                testUsers.find((u) => u.wa_id === chatPartnerId)?.name || "Unknown",
              avatar: "/default-avatar.png",
              messages: [msg],
              lastMessage: msg.text,
              time: msg.time,
              status: msg.status,
            };
            return [newChat, ...prevChats];
          } else {
            // Existing chat: update messages and last message info
            const updatedChat = { ...prevChats[chatIndex] };
            updatedChat.messages = [...updatedChat.messages, msg];
            updatedChat.lastMessage = msg.text;
            updatedChat.time = msg.time;
            updatedChat.status = msg.status;

            // Move updated chat to front
            const newChats = prevChats.filter((_, i) => i !== chatIndex);
            return [updatedChat, ...newChats];
          }
        });
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [userId, testUsers]);

  // Sort chats by last message timestamp descending
  const sortedChats = [...chats].sort((a, b) => {
    const timeA = a.messages[a.messages.length - 1]?.timestamp || 0;
    const timeB = b.messages[b.messages.length - 1]?.timestamp || 0;
    return timeB - timeA;
  });

  const selectedChat = sortedChats.find((chat) => chat.id === selectedChatId);

  const handleBackToList = () => setSelectedChatId(null);

  // Send message handler with optimistic update
  const handleSendMessage = (chatId, newMessage) => {
    // Ensure the message object has needed properties
    const msgObj = {
      ...newMessage,
      to: chatId,
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage.text,
              time:
                newMessage.time ||
                new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              status: newMessage.status || "sent",
            }
          : chat
      )
    );

    // Emit to server via socket
    socket.emit("sendMessage", msgObj);
  };

  // User toggle to switch active user (test mode)
  const toggleUser = () => {
    if (testUsers.length < 2) return;
    setUserId((prev) => {
      const idx = testUsers.findIndex((user) => user.wa_id === prev);
      return testUsers[(idx + 1) % testUsers.length].wa_id;
    });
    setSelectedChatId(null);
    setChats([]);
  };

  const currentUserName =
    testUsers.find((user) => user.wa_id === userId)?.name || "Loading...";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="p-4 bg-gray-800 text-white flex justify-between items-center flex-shrink-0">
        <h1 className="text-xl font-bold">WhatsApp Clone - Test Mode</h1>
        <button
          onClick={toggleUser}
          disabled={testUsers.length < 2}
          className={`px-3 py-1 rounded ${
            testUsers.length < 2
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Switch User (Current: {currentUserName})
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-grow overflow-hidden">
        {/* Desktop Layout */}
        <div className="hidden sm:flex w-full">
          <div className="w-1/3 border-r border-gray-300 overflow-y-auto">
            <ChatList
              chats={sortedChats}
              onSelectChat={setSelectedChatId}
              selectedChatId={selectedChatId}
              userId={userId}
            />
          </div>
          <div className="w-2/3 flex items-center justify-center bg-gray-50">
            {selectedChat ? (
              <div className="w-full max-h-full flex flex-col overflow-hidden">
                <ChatWindow
                  chat={selectedChat}
                  onBack={handleBackToList}
                  onSendMessage={handleSendMessage}
                  userId={userId}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a chat to start messaging
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex sm:hidden w-full h-full overflow-hidden">
          {!selectedChatId ? (
            <div className="w-full h-full overflow-y-auto">
              <ChatList
                chats={sortedChats}
                onSelectChat={setSelectedChatId}
                selectedChatId={selectedChatId}
                userId={userId}
              />
            </div>
          ) : (
            <div className="w-full flex items-center justify-center h-full bg-gray-50">
              <div className="w-full max-h-full flex flex-col overflow-hidden">
                <ChatWindow
                  chat={selectedChat}
                  onBack={handleBackToList}
                  onSendMessage={handleSendMessage}
                  userId={userId}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
