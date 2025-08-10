import { useState } from "react";

export default function ChatWindow({ chat, onBack, onSendMessage }) {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = async () => {
  if (!newMessage.trim()) return;

  if (!chat?.id) {
    console.error("No chat id available");
    return;
  }

  const msgObj = {
    id: Date.now().toString(),
    text: newMessage,
    sent: true,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    timestamp: Date.now(),
    status: "sent",
  };

  onSendMessage(chat.id, msgObj);

  try {
    console.log("Sending message:", { wa_id: chat.id, text: newMessage });
    const response = await fetch("https://whatsappchat-production-8347.up.railway.app/api/messages", {
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

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex items-center">
        <button
          onClick={onBack}
          className="sm:hidden mr-2 text-white font-bold"
        >
          ←
        </button>

        <div className="flex items-center gap-3">
          <img
            src={"/abstract-profile.png"}
            alt={chat.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h2 className="font-semibold">{chat.name}</h2>
            <p className="text-xs">online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        {chat.messages.map((msg, index) => (
          <div
            key={`${msg.id}-${index}`}
            className={`mb-2 flex ${msg.sent ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-2 rounded-lg max-w-xs ${
                msg.sent ? "bg-green-500 text-white" : "bg-white text-gray-800"
              }`}
            >
              <p>{msg.text}</p>
              <div className="flex items-center justify-end gap-1 mt-1 opacity-70 text-xs">
                <span>{msg.time}</span>
                {msg.sent && renderStatusIcon(msg.status)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white flex items-center gap-2">
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
          className="bg-green-600 text-white px-4 py-2 rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
}
