import { useState, useEffect, useRef } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function ChatWindow({ chat, onBack, onSendMessage, userId }) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when chat changes or messages update
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No chat selected
      </div>
    );
  }

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    if (!chat?.id) {
      console.error("No chat id available");
      return;
    }

    const now = new Date();
    const msgObj = {
      id: Date.now().toString(),
      text: newMessage,
      wa_id: userId,
      sent: true,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: now.getTime(),
      status: "sent",
    };

    onSendMessage(chat.id, msgObj);

    try {
      console.log("Sending message:", { wa_id: chat.id, text: newMessage });
      const response = await fetch(`${BACKEND_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wa_id: chat.id,
          text: newMessage,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error:", errorData);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }

    setNewMessage("");
  };

  const renderStatusIcon = (status) => {
    if (status === "sent") return <span>✓</span>;
    if (status === "delivered") return <span>✓✓</span>;
    if (status === "read") return <span className="text-blue-400">✓✓</span>;
    return null;
  };

  // Helper to get initials from name
  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0]?.toUpperCase())
      .join("")
      .slice(0, 2);

  return (
  <div className="flex flex-col h-full max-h-full overflow-y-auto">
    {/* Header */}
    <div className="bg-green-600 text-white p-4 flex items-center flex-shrink-0">
      <button
        onClick={onBack}
        className="sm:hidden mr-2 text-white font-bold"
      >
        ←
      </button>
      <div className="flex items-center gap-3">
        {chat.avatar ? (
          <img
            src="./abstract-profile.png"
            alt={chat.otherUserName}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-semibold select-none">
            {getInitials(chat.otherUserName)}
          </div>
        )}
        <div>
          <h2 className="font-semibold">{chat.otherUserName}</h2>
          <p className="text-xs">online</p>
        </div>
      </div>
    </div>

    {/* Messages: flex-grow + scroll */}
    <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
      {chat.messages.length === 0 ? (
        <p className="text-center text-gray-500 mt-4">No messages yet. Say hi!</p>
      ) : (
        chat.messages.map((msg, index) => {
          const isSentByUser = msg.wa_id === userId;
          return (
            <div
              key={`${msg.id}-${index}`}
              className={`mb-2 flex ${
                isSentByUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-2 rounded-lg max-w-xs break-words whitespace-pre-wrap ${
                  isSentByUser
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-800"
                }`}
              >
                <p>{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1 opacity-70 text-xs">
                  <span>
                    {msg.time ||
                      new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </span>
                  {isSentByUser && renderStatusIcon(msg.status)}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>

    {/* Input Area: fixed height */}
    <div className="p-3 bg-white flex items-center gap-2 flex-shrink-0">
      <input
        type="text"
        placeholder="Type a message"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        className="flex-1 p-2 border rounded-full outline-none"
      />
      <button
        onClick={handleSend}
        disabled={!newMessage.trim()}
        className="bg-green-600 disabled:bg-green-400 text-white px-4 py-2 rounded-full"
      >
        Send
      </button>
    </div>
  </div>
);

}
