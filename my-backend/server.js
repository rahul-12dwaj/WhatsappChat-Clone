const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config(); // Load .env variables

const app = express();
app.use(cors({
  origin: ["https://whatsapp-chat-clone-black.vercel.app/", "http://localhost:3000"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// Mongoose configuration to avoid deprecation warnings
mongoose.set("strictQuery", false);

// MongoDB Schema
const messageSchema = new mongoose.Schema({
  id: String,
  wa_id: String,
  name: String,
  text: String,
  sent: Boolean,
  time: String,
  status: String,
});
const ProcessedMessage = mongoose.model("processed_messages", messageSchema);

// 📌 Function to seed database
async function seedDatabase() {
  const payloadFiles = [
    "conversation_1_message_1.json",
    "conversation_1_message_2.json",
    "conversation_1_status_1.json",
    "conversation_1_status_2.json",
    "conversation_2_message_1.json",
    "conversation_2_message_2.json",
    "conversation_2_status_1.json",
    "conversation_2_status_2.json",
  ];

  for (const file of payloadFiles) {
    try {
      const raw = fs.readFileSync(path.join("./payloads", file), "utf-8");
      const payload = JSON.parse(raw);
      const change = payload.metaData?.entry?.[0]?.changes?.[0]?.value;
      if (!change) continue;

      const contact = change.contacts?.[0];
      const wa_id = contact?.wa_id;
      const name = contact?.profile?.name || "Unknown";

      if (change.messages) {
        for (const msg of change.messages) {
          await ProcessedMessage.create({
            id: msg.id,
            wa_id,
            name,
            text: msg.text?.body || "",
            time: new Date(parseInt(msg.timestamp) * 1000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            sent: msg.from !== wa_id,
            status: "read", // ✅ All seeded messages are marked as read
          });
        }
      }

      if (change.statuses) {
        for (const st of change.statuses) {
          await ProcessedMessage.updateOne({ id: st.id }, { $set: { status: st.status } });
        }
      }
    } catch (err) {
      console.error(`❌ Error seeding data from file ${file}:`, err);
    }
  }
  console.log("✅ Database seeded");
}

// Connect to MongoDB and run seed
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ MongoDB connected");

    // Optional: Clear old messages before seeding
    await ProcessedMessage.deleteMany({});
    await seedDatabase();

    // Start the server after seeding
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.get("/api/chats", async (req, res) => {
  try {
    const messages = await ProcessedMessage.find();

    const chatsMap = {};
    messages.forEach((msg) => {
      if (!chatsMap[msg.wa_id]) {
        chatsMap[msg.wa_id] = {
          id: msg.wa_id,
          name: msg.name || "Unknown",
          avatar: "/default-avatar.png",
          messages: [],
          lastMessage: "",
          time: "",
          status: "",
        };
      }

      chatsMap[msg.wa_id].messages.push(msg);
      chatsMap[msg.wa_id].lastMessage = msg.text;
      chatsMap[msg.wa_id].time = msg.time;
      chatsMap[msg.wa_id].status = msg.status; // ✅ Keep latest message's status
    });

    res.json(Object.values(chatsMap));
  } catch (err) {
    console.error("❌ Error fetching chats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { wa_id, text, name } = req.body;
    if (!wa_id || !text) {
      return res.status(400).json({ error: "Missing wa_id or text in request body" });
    }

    const newMsg = new ProcessedMessage({
      id: Date.now().toString(),
      wa_id,
      name: name || "Unknown",
      text,
      sent: true,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    });

    await newMsg.save();
    res.status(201).json(newMsg);
  } catch (err) {
    console.error("❌ Error saving message:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Global error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});
