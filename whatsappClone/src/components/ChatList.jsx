import { useState } from "react";

export default function ChatList({ chats = [], onSelectChat, selectedChatId }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter chats by name (case insensitive)
  const filteredChats = chats.filter((chat) =>
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full border-r border-gray-300 flex flex-col overflow-x-hidden min-w-0">
      {/* Search Bar */}
      <div className="p-2">
        <input
          type="text"
          placeholder="Search or start new chat"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 rounded-md bg-gray-100 outline-none"
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 min-w-0 ${
                selectedChatId === chat.id ? "bg-gray-200" : ""
              }`}
            >
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <h2 className="font-semibold text-sm truncate">{chat.name}</h2>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {chat.time}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate">{chat.lastMessage}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 mt-4 text-sm">
            No chats found
          </div>
        )}
      </div>
    </div>
  );
}
