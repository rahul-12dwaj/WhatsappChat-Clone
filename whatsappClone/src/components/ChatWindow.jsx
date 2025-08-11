import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const socket = io(BACKEND_URL, { autoConnect: false });

export default function ChatWindow({ chat, onBack, userId }) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(chat?.messages || []);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket setup
  useEffect(() => {
    if (!userId || !chat?.id) return;

    if (!socket.connected) socket.connect();
    socket.emit("register", userId);
    setMessages(chat?.messages || []);

    const handleNewMessage = (msg) => {
      setMessages((prev) => {
        // Match by server id OR by clientId for optimistic messages
        const exists = prev.find(
          (m) =>
            m.id === msg.id ||
            (m.clientId && msg.clientId && m.clientId === msg.clientId)
        );
        if (exists) {
          // Update existing message (e.g., status, id from server)
          return prev.map((m) =>
            m.clientId === msg.clientId || m.id === msg.id
              ? { ...m, ...msg }
              : m
          );
        }
        return [...prev, msg];
      });
    };

    const handleMessageSent = (msg) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, status: msg.status || "sent" } : m
        )
      );
    };

    const handleStatusUpdate = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status } : m))
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageSent", handleMessageSent);
    socket.on("messageStatusUpdated", handleStatusUpdate);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageSent", handleMessageSent);
      socket.off("messageStatusUpdated", handleStatusUpdate);
    };
  }, [userId, chat]);

  // Send message with clientId
  const handleSend = () => {
    if (!newMessage.trim()) return;

    const now = new Date();
    const clientId = `local-${Date.now()}`; // unique id for matching

    const msgObj = {
      clientId,
      text: newMessage.trim(),
      wa_id: userId,
      to: chat.id,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: now.getTime(),
      status: "pending",
      name: "You",
    };


    // Send to backend
    socket.emit("sendMessage", msgObj);
    setNewMessage("");
  };

  // Render "Seen" status
  const renderSeenStatus = (msg, index) => {
    const isLastMessage =
      index === messages.length - 1 && msg.wa_id === userId;
    return isLastMessage ? (
      <div className="text-xs text-blue-900 ml-2 justify-end">Seen</div>
    ) : null;
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0]?.toUpperCase())
      .join("")
      .slice(0, 2);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No chat selected
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex items-center flex-shrink-0">
        <button onClick={onBack} className="sm:hidden mr-2 text-white font-bold">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-4">
            No messages yet. Say hi!
          </p>
        ) : (
          messages.map((msg, index) => {
            const isSentByUser = msg.wa_id === userId;
            return (
              <div
                key={msg.clientId || msg.id}
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
                    {isSentByUser && renderSeenStatus(msg, index)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
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
