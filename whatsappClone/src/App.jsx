import { useEffect, useState } from "react";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import loadChats from "./loadChats";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

  // Load chats whenever userId or testUsers changes
  useEffect(() => {
    if (!userId) return;

    async function fetchChats() {
      try {
        const data = await loadChats(userId);
        // data = array of chats; each chat.id is the other user's wa_id

        // Add otherUserName for each chat from testUsers by wa_id = chat.id
        const chatsWithNames = data.map((chat) => ({
          ...chat,
          otherUserWaId: chat.id,
          otherUserName:
            testUsers.find((u) => u.wa_id === chat.id)?.name || "Unknown",
        }));

        setChats(chatsWithNames);
      } catch (error) {
        console.error("Failed to load chats:", error);
        setChats([]);
      }
    }

    fetchChats();
    setSelectedChatId(null);
  }, [userId, testUsers]);

  // Sort chats by last message timestamp descending
  const sortedChats = [...chats].sort((a, b) => {
    const timeA = a.messages[a.messages.length - 1]?.timestamp || 0;
    const timeB = b.messages[b.messages.length - 1]?.timestamp || 0;
    return timeB - timeA;
  });

  const selectedChat = sortedChats.find((chat) => chat.id === selectedChatId);

  const handleBackToList = () => setSelectedChatId(null);

  const handleSendMessage = async (chatId, newMessage) => {
    const receiverWaId = chatId; // chat.id === otherUserWaId

    // Optimistic UI update
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
            }
          : chat
      )
    );

    try {
      const response = await fetch(`${BACKEND_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wa_id: userId,
          to: receiverWaId,
          text: newMessage.text,
          name: newMessage.name || "Unknown",
        }),
      });

      if (!response.ok) {
        console.error("Failed to send message:", response.statusText);
      } else {
        // Refresh chats after send
        const updatedChats = await loadChats(userId);
        const chatsWithNames = updatedChats.map((chat) => ({
          ...chat,
          otherUserWaId: chat.id,
          otherUserName:
            testUsers.find((u) => u.wa_id === chat.id)?.name || "Unknown",
        }));
        setChats(chatsWithNames);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

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
          {/* Chat List - scrollable */}
          <div className="w-1/3 border-r border-gray-300 overflow-y-auto">
            <ChatList
              chats={sortedChats}
              onSelectChat={setSelectedChatId}
              selectedChatId={selectedChatId}
              userId={userId}
            />
          </div>

          {/* Chat Window - centered, no page scroll */}
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
