import { useState, useCallback } from "react";

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}

export default function ChatList({ chats = [], onSelectChat, selectedChatId }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter chats by otherUserName (case insensitive)
  const filteredChats = chats.filter((chat) =>
    chat.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectChat = useCallback(
    (id) => () => {
      onSelectChat(id);
    },
    [onSelectChat]
  );

  const handleKeyDown = useCallback(
    (id) => (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelectChat(id);
      }
    },
    [onSelectChat]
  );

  return (
    <div className="w-full border-r border-gray-300 flex flex-col overflow-x-hidden  min-w-0 h-screen">
      {/* Search Bar */}
      <div className="p-2">
        <input
          type="search"
          aria-label="Search or start new chat"
          placeholder="Search or start new chat"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 rounded-md bg-gray-100 outline-none"
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-hidden" role="list" aria-label="Chat list">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => {
            const isSelected = selectedChatId === chat.id;
            const initials = getInitials(chat.otherUserName);
            const lastMessage = chat.lastMessage || "";
            const time = chat.time || "";

            // Optionally highlight unread chats
            const isUnread = chat.status === "delivered" || chat.status === "received";

            return (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                onClick={handleSelectChat(chat.id)}
                onKeyDown={handleKeyDown(chat.id)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 min-w-0 outline-none ${
                  isSelected ? "bg-gray-200" : ""
                }`}
                aria-current={isSelected ? "true" : "false"}
              >
                {chat.avatar ? (
                  <img
                    src="/abstract-profile.png"
                    alt={`Avatar of ${chat.otherUserName}`}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                    loading="lazy"
                  />

                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-semibold flex-shrink-0 select-none">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <h2
                      className={`font-semibold text-sm truncate ${
                        isUnread ? "font-bold" : ""
                      }`}
                    >
                      {chat.otherUserName}
                    </h2>
                    <span className="text-xs text-gray-500 flex-shrink-0">{time}</span>
                  </div>
                  <p
                    className={`text-xs truncate ${
                      isUnread ? "font-semibold text-gray-800" : "text-gray-600"
                    }`}
                    title={lastMessage}
                  >
                    {lastMessage}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 mt-4 text-sm" role="alert" aria-live="polite">
            No chats found
          </div>
        )}
      </div>
    </div>
  );
}
