const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");  // For server
const { Server } = require("socket.io");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection (same as before)
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

// Message Schema and Model (same as your original)
const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  wa_id: { type: String, required: true },
  to: { type: String, required: true },
  name: String,
  text: String,
  sent: Boolean,
  time: String,
  timestamp: Number,
  status: String,
});
messageSchema.index({ id: 1 }, { unique: true });
const Message = mongoose.model("Message", messageSchema);

// Your helper function buildChatsForUser() here (unchanged)...

// Express routes (your existing REST API endpoints) here (unchanged)...

// --- Create HTTP server and integrate with Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust as needed for security
    methods: ["GET", "POST"],
  },
});

// Map to track connected users and their socket IDs for direct messaging
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for user registering their userId (wa_id)
  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User registered: ${userId} with socket id ${socket.id}`);
  });

  // Listen for sending messages via WebSocket
  socket.on("sendMessage", async (data) => {
    // Data expected: { wa_id: senderId, to: receiverId, text, name }

    if (!data.wa_id || !data.to || !data.text) {
      console.log("Invalid message data", data);
      return;
    }

    const now = new Date();

    // Create message document
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
      // Emit message back to sender
      socket.emit("messageSent", newMsg);

      // Emit message to receiver if online
      const receiverSocketId = onlineUsers.get(data.to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMsg);
      }
    } catch (err) {
      console.error("Error saving message via socket:", err);
      socket.emit("error", { error: "Failed to save message" });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove from onlineUsers map
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User unregistered: ${userId}`);
        break;
      }
    }
  });
});

// Use your existing PORT or default
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
