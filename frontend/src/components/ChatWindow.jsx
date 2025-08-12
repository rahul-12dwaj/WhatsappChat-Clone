import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { io } from "socket.io-client";
import { FiPhone, FiVideo, FiPaperclip, FiMic } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const socket = io(BACKEND_URL, { autoConnect: false });

export default function ChatWindow({ chat, onBack, userId }) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch all messages for selected chat
  useEffect(() => {
    if (!chat?.id) return;
    setLoading(true);

    async function fetchMessages() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/messages/${chat.id}`);
        if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
        const msgs = await res.json();
        setMessages(msgs);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [chat?.id]);

  // Socket listeners
  useEffect(() => {
    if (!userId || !chat?.id) return;

    if (!socket.connected) socket.connect();
    socket.emit("register", userId);

    const handleNewMessage = (msg) => {
      if (msg.wa_id === chat.id || msg.to === chat.id) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) => m.id === msg.id || m.clientId === msg.clientId
          );
          return exists
            ? prev.map((m) =>
                m.clientId === msg.clientId || m.id === msg.id
                  ? { ...m, ...msg }
                  : m
              )
            : [...prev, msg];
        });
      }
    };

    const handleMessageSent = (msg) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.clientId === msg.clientId || m.id === msg.id
            ? { ...m, status: msg.status || "sent" }
            : m
        )
      );
    };

    const handleStatusUpdate = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status } : m
        )
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
  }, [userId, chat?.id]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const now = new Date();
    const clientId = `local-${Date.now()}`;

    const msgObj = {
      clientId,
      wa_id: userId,
      to: chat.id,
      name: "You",
      text: newMessage.trim(),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: now.getTime(),
      status: "pending",
      sender: "business"
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, msgObj]);
    setNewMessage("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wa_id: chat.id,
          contactName: chat.otherUserName,
          text: msgObj.text
        })
      });

      if (!res.ok) throw new Error(`Failed to send: ${res.status}`);
      const data = await res.json();
      const msgId = data?.message?._id || clientId;

      setMessages((prev) =>
        prev.map((m) =>
          m.clientId === clientId ? { ...m, status: "sent", id: msgId } : m
        )
      );

      socket.emit("sendMessage", { ...msgObj, id: msgId });
    } catch (err) {
      console.error("Send message error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.clientId === clientId ? { ...m, status: "failed" } : m
        )
      );
    }
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0]?.toUpperCase())
      .join("")
      .slice(0, 2);

  const handleNotWorkingAlert = () => alert("Not in working mode yet");

  // Render WhatsApp style ticks
  const renderTicks = (msg) => {
    if (msg.sender !== "business") return null;

    switch (msg.status) {
      case "sent":
        return <span className="text-gray-400 ml-1">✓</span>;
      case "delivered":
        return <span className="text-gray-400 ml-1">✓✓</span>;
      case "read":
        return <span className="text-blue-400 ml-1">✓✓</span>;
      default:
        return null;
    }
  };


  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No chat selected
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-full bg-[#111b21] text-[#e9edef] overflow-hidden">
      {/* HEADER */}
      <div className="bg-[#202c33] p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="sm:hidden mr-2 font-bold">←</button>
          {chat.avatar ? (
            <img src="./abstract-profile.png" alt={chat.otherUserName} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center font-semibold">
              {getInitials(chat.otherUserName)}
            </div>
          )}
          <div>
            <h2 className="font-semibold">{chat.otherUserName}</h2>
            <p className="text-xs text-[#8696a0]">{chat.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[#8696a0]">
          <button className="p-2 rounded-full hover:bg-[#2a3942]" onClick={handleNotWorkingAlert}><FiPhone size={20} /></button>
          <button className="p-2 rounded-full hover:bg-[#2a3942]" onClick={handleNotWorkingAlert}><FiVideo size={20} /></button>
        </div>
      </div>

      {/* MESSAGES */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{
          backgroundImage: 'url("/background.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {loading ? (
          <p className="text-center text-[#8696a0] mt-4">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-[#8696a0] mt-4">No messages yet. Say hi!</p>
        ) : (
          messages.map((msg, index) => {
            const isSentByUser = msg.sender === "business";
            return (
              <div
                key={msg.clientId || msg.id || `${index}-${msg.timestamp}`}
                className={`mb-2 flex ${isSentByUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-2 rounded-lg max-w-xs break-words ${
                    isSentByUser ? "bg-[#005c4b]" : "bg-[#202c33]"
                  }`}
                >
                  <p>{msg.text || ""}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 opacity-70 text-xs">
                    <span>
                      {msg.time ||
                        (msg.timestamp &&
                          new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }))}
                    </span>
                    {isSentByUser && renderTicks(msg)}

                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

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
