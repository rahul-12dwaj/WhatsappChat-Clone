const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// ==== MongoDB Connection ====
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ==== Schemas ====
const userSchema = new mongoose.Schema({
  wa_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: String,
});

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // message UUID
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: String,
  sent: Boolean,
  time: String,
  timestamp: Number,
  status: String,
});

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);

// ==== Socket.io Setup ====
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 20000,
  pingInterval: 25000
});

const onlineUsers = new Map(); // Map<wa_id, socket.id>

// Utility to generate unique message IDs
const generateMessageId = () => crypto.randomUUID();

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // Ensure we remove all old listeners when reconnecting
  socket.removeAllListeners();

  // User registration
  socket.on("register", (wa_id) => {
    onlineUsers.set(wa_id, socket.id);
    console.log(`📌 Registered ${wa_id} → socket ${socket.id}`);
  });

  // Send message event
  socket.on("sendMessage", async (msg, ack) => {
    try {
      // Deduplication: If msg.id exists, ignore
      if (!msg.id) msg.id = generateMessageId();

      const exists = await Message.findOne({ id: msg.id });
      if (exists) {
        console.log(`⚠️ Duplicate message ignored: ${msg.id}`);
        if (ack) ack({ delivered: true, duplicate: true });
        return;
      }

      const fromUser = await User.findOne({ wa_id: msg.wa_id });
      const toUser = await User.findOne({ wa_id: msg.to });

      if (!fromUser || !toUser) {
        console.error("❌ Invalid user(s) for message");
        if (ack) ack({ delivered: false, error: "Invalid user(s)" });
        return;
      }

      const newMsg = await Message.create({
        id: msg.id,
        from: fromUser._id,
        to: toUser._id,
        text: msg.text,
        sent: true,
        time: msg.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: Date.now(),
        status: "sent",
      });

      const populatedMsg = {
        id: newMsg.id,
        text: newMsg.text,
        sent: newMsg.sent,
        time: newMsg.time,
        timestamp: newMsg.timestamp,
        status: newMsg.status,
        wa_id: fromUser.wa_id,
        fromName: fromUser.name,
        to: toUser.wa_id,
        toName: toUser.name,
      };

      // Emit to recipient (if online)
      const recipientSocket = onlineUsers.get(toUser.wa_id);
      if (recipientSocket) {
        io.to(recipientSocket).emit("newMessage", populatedMsg);
      }

      // Emit back to sender as confirmation
      const senderSocket = onlineUsers.get(fromUser.wa_id);
      if (senderSocket) {
        io.to(senderSocket).emit("newMessage", populatedMsg);
      }

      // Send ack back to client for delivery confirmation
      if (ack) ack({ delivered: true, id: newMsg.id });

    } catch (err) {
      console.error("❌ Error sending message:", err);
      if (ack) ack({ delivered: false, error: err.message });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
    for (let [wa_id, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(wa_id);
        break;
      }
    }
  });
});

// ==== REST API Routes ====

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "wa_id name");
    res.json(users);
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get chats for a user
app.get("/api/chats", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const user = await User.findOne({ wa_id: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const messages = await Message.find({
      $or: [{ from: user._id }, { to: user._id }],
    })
    .populate("from", "wa_id name phone")
    .populate("to", "wa_id name phone")

    .sort({ timestamp: 1 });

    const chatsMap = {};
    messages.forEach((msg) => {
      const otherUser = msg.from.wa_id === userId ? msg.to : msg.from;
      if (!chatsMap[otherUser.wa_id]) {
        chatsMap[otherUser.wa_id] = {
          id: otherUser.wa_id,
          name: otherUser.name,
          messages: [],
          phone: otherUser.phone,
        };
      }
      chatsMap[otherUser.wa_id].messages.push({
        id: msg.id,
        text: msg.text,
        sent: msg.sent,
        time: msg.time,
        timestamp: msg.timestamp,
        status: msg.status,
        wa_id: msg.from.wa_id,
      });
    });

    res.json(Object.values(chatsMap));
  } catch {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
