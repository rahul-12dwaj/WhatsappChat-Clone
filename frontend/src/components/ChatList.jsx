import { useState, useCallback } from "react";

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  return isToday
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "2-digit", month: "short" });
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
      className="w-full border-r border-[#222D32] flex flex-col overflow-x-hidden min-w-0 bg-[#161717] text-[#E9EDEF]"
      role="list"
      aria-label="Chat list"
    >
      {/* Title */}
      

    <div
      className="mt-3 text-xl font-bold p-4 flex items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2">
        WhatsApp{" "}
        <span
          aria-hidden="true"
          className="bg-[#25D366] text-[#111b21] rounded-full px-2 py-0.5 text-xs font-semibold"
          title={`${chats.length} chats`}
        >
          {chats.length}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <img
          src="/new-message.png"
          alt="Add Chat"
          className="w-6 h-6 cursor-pointer mr-2"
          onClick={() => alert("Add new chat clicked")}
          draggable={false}
        />
        <img
          src="/menu.png"
          alt="Menu"
          className="w-6 h-6 cursor-pointer"
          onClick={() => alert("Menu clicked")}
          draggable={false}
        />
      </div>
    </div>


      {/* Search Bar */}
      <input
        type="search"
        aria-label="Search or start new chat"
        placeholder="Search or start new chat"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="m-2 p-2 rounded-full bg-[#2e2f2f] border border-transparent hover:border-gray-700 text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-gray-700 focus:ring-2 focus:ring-[#25D366] transition-colors duration-200"
        autoComplete="off"
      />


      <div className="mt-3 mb-3 ">
        <button className="text-[#111B21] border border-[#222D32] rounded-full ml-3 p-2 bg-[#10362A] pl-4 pr-4 ">All</button>
        <button className="border border-[#222D32] rounded-full ml-3 p-2 pl-4 pr-4">Unread</button>
        <button className="border border-[#222D32] rounded-full ml-3 p-2 pl-4 pr-4">Favourites</button>
        <button className="border border-[#222D32] rounded-full ml-3 p-2 pl-4 pr-4">Groups</button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => {
            const isSelected = selectedChatId === chat.id;
            const initials = getInitials(chat.otherUserName);
            const lastMessage = chat.lastMessage || "";
            const formattedTime = formatTime(chat.time);

            return (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                onClick={handleSelectChat(chat.id)}
                onKeyDown={handleKeyDown(chat.id)}
                className={`flex items-center gap-3 p-3 cursor-pointer min-w-0 outline-none select-none transition-colors duration-200 ${
                  isSelected ? "bg-[#2e2f2f]" : "hover:bg-[#292a2a]"
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
                  <div className="w-12 h-12 rounded-full bg-[#005c4b] text-[#111B21] flex items-center justify-center font-semibold flex-shrink-0 select-none text-lg">
                    {initials}
                  </div>
                )}

                {/* Text block */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex justify-between items-center gap-2">
                    <h2 className="text-base truncate font-medium text-[#E9EDEF]">
                      {chat.otherUserName}
                    </h2>
                    <span className="text-xs text-[#8696A0] flex-shrink-0 tabular-nums">
                      {formattedTime}
                    </span>
                  </div>
                  <p
                    className="text-sm truncate text-[#8696A0]"
                    title={lastMessage}
                  >
                    {lastMessage}
                  </p>
                </div>
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
