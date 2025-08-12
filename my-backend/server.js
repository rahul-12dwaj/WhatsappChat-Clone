require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');              // ✅ Required for Socket.IO
const { Server } = require('socket.io');   // ✅ Socket.IO server
const connectDB = require('./config/db');
const webhookRoutes = require('./routes/webhookRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// connect DB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp';
connectDB(MONGODB_URI);

// create HTTP server
const server = http.createServer(app);

// setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // allow all for dev, change in production
    methods: ["GET", "POST"]
  }
});

// store connected users
const connectedUsers = new Map();

// socket.io events
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("register", (userId) => {
    console.log(`📌 User registered: ${userId}`);
    connectedUsers.set(userId, socket.id);
    socket.join(userId); // join a private room for this user
  });

  socket.on("sendMessage", (msg) => {
  if (!msg || !msg.to) {
    console.error("Invalid message object received:", msg);
    return;
  }
  io.to(msg.to).emit("newMessage", msg);
  });


  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    for (let [userId, id] of connectedUsers.entries()) {
      if (id === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

// attach io to app so routes can use it
app.set("io", io);

// routes
app.use('/api', messageRoutes);
app.use('/', webhookRoutes);

// health check
app.get('/health', (req, res) => res.json({ ok: true }));

// start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
