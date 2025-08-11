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
    <div
      className="w-full border-r border-[#222D32] flex flex-col overflow-x-hidden min-w-0  bg-[#111B21] text-[#E9EDEF]"
      role="list"
      aria-label="Chat list"
    >
      {/* Title */}
      <p className="text-xl font-bold p-4 border-b border-[#222D32] bg-[#111B21] flex items-center gap-2">
        Chats{" "}
        <span
          aria-hidden="true"
          className="bg-[#25D366] text-[#111B21] rounded-full px-2 py-0.5 text-xs font-semibold"
          title={`${chats.length} chats`}
        >
          {chats.length}
        </span>
      </p>

      {/* Search Bar */}
      <div className="p-2">
        <input
          type="search"
          aria-label="Search or start new chat"
          placeholder="Search or start new chat"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 rounded-md bg-[#2A3942]  border-b hover:border-[#25D366] text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:ring-2 focus:ring-[#25D366]"
          autoComplete="off"
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => {
            const isSelected = selectedChatId === chat.id;
            const initials = getInitials(chat.otherUserName);
            const lastMessage = chat.lastMessage || "";
            const time = chat.time || "";
            const isUnread =
              chat.status === "delivered" ||
              chat.status === "received" ||
              (chat.unreadCount && chat.unreadCount > 0);

            return (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                onClick={handleSelectChat(chat.id)}
                onKeyDown={handleKeyDown(chat.id)}
                className={`flex items-center gap-3 p-3 cursor-pointer min-w-0 outline-none select-none  hover:bg-[#2A3942] transition-colors duration-200 ${
                  isSelected ? "" : "hover:bg-[#2A3942]"
                }`}
                aria-current={isSelected ? "true" : "false"}
                aria-label={`Chat with ${chat.otherUserName}, last message ${lastMessage}`}
              >
                {/* Avatar */}
                {chat.avatar ? (
                  <img
                    src="/abstract-profile.png"
                    alt={`Avatar of ${chat.otherUserName}`}
                    className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#25D366] text-[#111B21] flex items-center justify-center font-semibold flex-shrink-0 select-none text-lg">
                    {initials}
                  </div>
                )}

                {/* Text block */}
                <div className="flex-1 min-w-0 border-transparent pb-1">
                  <div className="flex justify-between items-center gap-2">
                    <h2
                      className={`text-sm truncate ${
                        isUnread
                          ? "font-semibold text-[#E9EDEF]"
                          : "font-medium text-[#E9EDEF]"
                      }`}
                    >
                      {chat.otherUserName}
                    </h2>
                    <span className="text-xs text-[#8696A0] flex-shrink-0 tabular-nums">
                      {time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Status icon simulation */}
                    {isUnread && (
                      <span
                        aria-hidden="true"
                        className="text-xs text-[#25D366]"
                        title="Unread message"
                      >
                        ●
                      </span>
                    )}
                    <p
                      className={`text-xs truncate ${
                        isUnread ? "font-semibold text-[#E9EDEF]" : "text-[#8696A0]"
                      }`}
                      title={lastMessage}
                    >
                      {lastMessage}
                    </p>
                  </div>
                </div>

                {/* Unread badge */}
                {chat.unreadCount > 0 && (
                  <span
                    aria-label={`${chat.unreadCount} unread messages`}
                    className="bg-[#25D366] text-[#111B21] text-xs font-semibold rounded-full min-w-[18px] h-5 flex items-center justify-center px-2 select-none"
                  >
                    {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <div
            className="text-center text-[#8696A0] mt-4 text-sm"
            role="alert"
            aria-live="polite"
          >
            No chats found
          </div>
        )}
      </div>
    </div>
  );
}
