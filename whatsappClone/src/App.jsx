import { useEffect, useState } from "react";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import loadChats from "./loadChats";

function App() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  // 📌 Sort helper
  const sortChatsByLastMessage = (chatArray) => {
    return [...chatArray].sort((a, b) => {
      const timeA = a.messages[a.messages.length - 1]?.timestamp || 0;
      const timeB = b.messages[b.messages.length - 1]?.timestamp || 0;
      return timeB - timeA;
    });
  };

  // Load chats and sort them
  useEffect(() => {
    loadChats().then((data) => {
      setChats(sortChatsByLastMessage(data));
    });
  }, []);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  const handleBackToList = () => setSelectedChatId(null);

  // ✅ Update and sort after sending message
  const handleSendMessage = (chatId, newMessage) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage.text,
              time: newMessage.time,
            }
          : chat
      );

      return sortChatsByLastMessage(updatedChats);
    });
  };

  return (
    <div className="flex h-screen">
      {/* Desktop View */}
      <div className="hidden sm:flex w-full">
        <div className="w-1/3 border-r border-gray-300">
          <ChatList
            chats={chats}
            onSelectChat={setSelectedChatId}
            selectedChatId={selectedChatId}
          />
        </div>
        <div className="w-2/3 h-screen">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              onBack={handleBackToList}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>

      {/* Mobile View */}
      <div className="flex sm:hidden w-full">
        {!selectedChatId ? (
          <div className="w-full">
            <ChatList
              chats={chats}
              onSelectChat={setSelectedChatId}
              selectedChatId={selectedChatId}
            />
          </div>
        ) : (
          <div className="w-full">
            <ChatWindow
              chat={selectedChat}
              onBack={handleBackToList}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
