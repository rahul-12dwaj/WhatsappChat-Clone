import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { FiPhone, FiVideo, FiPaperclip, FiMic } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const socket = io(BACKEND_URL, { autoConnect: false });

export default function ChatWindow({ chat, onBack, userId }) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(chat?.messages || []);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!userId || !chat?.id) return;

    if (!socket.connected) socket.connect();
    socket.emit("register", userId);
    setMessages(chat?.messages || []);

    const handleNewMessage = (msg) => {
      setMessages((prev) => {
        const exists = prev.find(
          (m) =>
            m.id === msg.id ||
            (m.clientId && msg.clientId && m.clientId === msg.clientId)
        );
        if (exists) {
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

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const now = new Date();
    const clientId = `local-${Date.now()}`;

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

    socket.emit("sendMessage", msgObj);
    setNewMessage("");
  };

  const handleNotWorkingAlert = () => {
    alert("Not in working mode yet");
  };

  const renderSeenStatus = (msg, index) => {
    const isLastMessage =
      index === messages.length - 1 && msg.wa_id === userId;
    return isLastMessage ? (
      <div className="text-xs text-blue-400 ml-2 justify-end">Seen</div>
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
    <div className="flex flex-col h-screen max-h-full bg-[#111b21] text-[#e9edef] overflow-hidden">
      {/* Header */}
      <div className="bg-[#202c33] p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="sm:hidden mr-2 font-bold">
            ←
          </button>
          {chat.avatar ? (
            <img
              src="./abstract-profile.png"
              alt={chat.otherUserName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center font-semibold select-none">
              {getInitials(chat.otherUserName)}
            </div>
          )}
          <div>
            <h2 className="font-semibold">{chat.otherUserName}</h2>
            <p className="text-xs text-[#8696a0]">{chat.phone}</p>
          </div>
        </div>

        {/* Call buttons */}
        <div className="flex items-center gap-3 text-[#8696a0]">
          <button
            className="p-2 rounded-full hover:bg-[#2a3942] transition-colors duration-200"
            title="Voice Call"
            aria-label="Voice Call"
            onClick={handleNotWorkingAlert}
          >
            <FiPhone size={20} />
          </button>
          <button
            className="p-2 rounded-full hover:bg-[#2a3942] transition-colors duration-200"
            title="Video Call"
            aria-label="Video Call"
            onClick={handleNotWorkingAlert}
          >
            <FiVideo size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{
          backgroundImage: 'url("/background.jpg")',
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#e0e0e0", // fallback color, optional
        }}
      >
        {messages.length === 0 ? (
          <p className="text-center text-[#8696a0] mt-4">
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
                      ? "bg-[#005c4b] text-[#e9edef]"
                      : "bg-[#202c33] text-[#e9edef]"
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

      {/* Input Footer */}
      {/* Input Footer */}
      <div className="p-3 bg-[#202c33] flex items-center gap-3 flex-shrink-0">
        {/* Emoji button */}
        <button
          className="p-2 rounded-full hover:bg-[#2a3942] text-[#8696a0] transition-colors duration-200 flex-shrink-0"
          title="Emoji"
          aria-label="Emoji"
          onClick={handleNotWorkingAlert}
        >
          <BsEmojiSmile size={22} />
        </button>

        {/* File share button */}
        <button
          className="p-2 rounded-full hover:bg-[#2a3942] text-[#8696a0] transition-colors duration-200 flex-shrink-0"
          title="Attach"
          aria-label="Attach file"
          onClick={handleNotWorkingAlert}
        >
          <FiPaperclip size={22} />
        </button>

        {/* Input */}
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
          className="flex-grow p-2 rounded-full outline-none bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]"
          style={{ minWidth: 0 }} // important to prevent overflow in flex containers
        />

        {/* Voice message button */}
        <button
          className="p-2 rounded-full hover:bg-[#2a3942] text-[#8696a0] transition-colors duration-200 flex-shrink-0"
          title="Voice message"
          aria-label="Voice message"
          onClick={handleNotWorkingAlert}
        >
          <FiMic size={22} />
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className="bg-[#005c4b] disabled:bg-[#025144] text-white px-4 py-2 rounded-full transition-colors duration-200 flex-shrink-0"
        >
          Send
        </button>
      </div>

    </div>
  );
}
