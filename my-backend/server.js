const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ==== Schemas ====
const userSchema = new mongoose.Schema({
  wa_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: String,
});

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
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

// ==== Socket.io ====
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("register", async (wa_id) => {
    onlineUsers[wa_id] = socket.id;
    console.log(`📌 Registered user ${wa_id} with socket ${socket.id}`);
  });

  socket.on("sendMessage", async (msg) => {
    try {
      const fromUser = await User.findOne({ wa_id: msg.wa_id });
      const toUser = await User.findOne({ wa_id: msg.to });

      if (!fromUser || !toUser) return console.error("❌ Invalid user(s) for message");

      const newMsg = await Message.create({
        id: `msg_${Date.now()}`,
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

      // Send to recipient if online
      if (onlineUsers[toUser.wa_id]) {
        io.to(onlineUsers[toUser.wa_id]).emit("newMessage", populatedMsg);
      }

      // Send to sender as confirmation
      if (onlineUsers[fromUser.wa_id]) {
        io.to(onlineUsers[fromUser.wa_id]).emit("newMessage", populatedMsg);
      }

    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
    for (let wa_id in onlineUsers) {
      if (onlineUsers[wa_id] === socket.id) {
        delete onlineUsers[wa_id];
        break;
      }
    }
  });
});

// ==== API Routes ====

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "wa_id name");
    res.json(users);
  } catch (err) {
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
      .populate("from", "wa_id name")
      .populate("to", "wa_id name")
      .sort({ timestamp: 1 });

    // Group messages by other participant's wa_id
    const chatsMap = {};
    messages.forEach((msg) => {
      const otherUser = msg.from.wa_id === userId ? msg.to : msg.from;
      if (!chatsMap[otherUser.wa_id]) {
        chatsMap[otherUser.wa_id] = {
          id: otherUser.wa_id,
          name: otherUser.name,
          messages: [],
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
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
