const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Message Schema and Model
const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // unique message ID
  wa_id: { type: String, required: true },  // sender WhatsApp ID
  to: { type: String, required: true },     // receiver WhatsApp ID
  name: String,                             // sender name
  text: String,
  sent: Boolean,                           // true if message is sent by wa_id
  time: String,                           // human-readable time (HH:mm)
  timestamp: Number,                      // unix ms timestamp
  status: String,                        // sent, delivered, read, etc.
});
messageSchema.index({ id: 1 }, { unique: true });
const Message = mongoose.model("Message", messageSchema);

// Helper: Group messages into chats for a user (same as before)
function buildChatsForUser(messages, currentUserId) {
  const chatsMap = {};

  messages.forEach((msg) => {
    const chatPartnerId = msg.wa_id === currentUserId ? msg.to : msg.wa_id;
    const chatPartnerName = msg.wa_id === currentUserId ? null : msg.name;

    if (!chatsMap[chatPartnerId]) {
      chatsMap[chatPartnerId] = {
        id: chatPartnerId,
        name: chatPartnerName || "Unknown",
        avatar: "/default-avatar.png",
        messages: [],
        lastMessage: "",
        time: "",
        status: "",
      };
    }

    chatsMap[chatPartnerId].messages.push(msg);

    const lastMsg = chatsMap[chatPartnerId].messages.reduce(
      (latest, m) => (m.timestamp > (latest?.timestamp || 0) ? m : latest),
      null
    );

    if (lastMsg) {
      chatsMap[chatPartnerId].lastMessage = lastMsg.text;
      chatsMap[chatPartnerId].time = lastMsg.time;
      chatsMap[chatPartnerId].status = lastMsg.status;
    }
  });

  return Object.values(chatsMap).sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1].timestamp || 0;
    const bLast = b.messages[b.messages.length - 1].timestamp || 0;
    return bLast - aLast;
  });
}

// REST endpoints for fetching users and chats (unchanged)
app.get("/api/users", async (req, res) => {
  try {
    const senders = await Message.aggregate([
      { $group: { _id: "$wa_id", name: { $first: "$name" } } },
      { $project: { _id: 0, wa_id: "$_id", name: 1 } },
    ]);

    const receivers = await Message.aggregate([
      { $group: { _id: "$to" } },
      { $project: { _id: 0, wa_id: "$_id" } },
    ]);

    const combined = [
      ...senders,
      ...receivers.map((r) => ({ wa_id: r.wa_id, name: null })),
    ];

    const usersMap = new Map();
    combined.forEach((u) => {
      if (!usersMap.has(u.wa_id)) {
        usersMap.set(u.wa_id, { wa_id: u.wa_id, name: u.name || "Unknown" });
      } else if (usersMap.get(u.wa_id).name === "Unknown" && u.name) {
        usersMap.set(u.wa_id, { wa_id: u.wa_id, name: u.name });
      }
    });

    const users = Array.from(usersMap.values());

    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/chats", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: "Missing userId query param" });

  try {
    const messages = await Message.find({
      $or: [{ wa_id: userId }, { to: userId }],
    }).sort({ timestamp: 1 });

    const chats = buildChatsForUser(messages, userId);

    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Remove or comment out the REST POST /api/messages route to avoid conflict

// Create HTTP server & setup Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Register user socket
  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User registered: ${userId} with socket id ${socket.id}`);
  });

  // Handle sending message over socket
  socket.on("sendMessage", async (data) => {
    // data = { wa_id: senderId, to: receiverId, text, name }

    if (!data.wa_id || !data.to || !data.text) {
      console.log("Invalid message data", data);
      return;
    }

    const now = new Date();
    const newMsg = new Message({
      id: Date.now().toString(),
      wa_id: data.wa_id,
      to: data.to,
      name: data.name || "Unknown",
      text: data.text,
      sent: true,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: now.getTime(),
      status: "sent",
    });

    try {
      await newMsg.save();

      // Emit confirmation back to sender
      socket.emit("messageSent", newMsg);

      // Emit new message to receiver if online
      const receiverSocketId = onlineUsers.get(data.to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMsg);
      }
    } catch (err) {
      console.error("Error saving message via socket:", err);
      socket.emit("error", { error: "Failed to save message" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User unregistered: ${userId}`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
