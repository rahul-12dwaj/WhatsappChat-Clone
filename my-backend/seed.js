const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

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

const Message = mongoose.model("Message", messageSchema);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected for seeding");

    // Clear existing messages
    await Message.deleteMany({});

    // Define users
    const neha = {
      wa_id: "wa_neha123",
      name: "Neha Joshi",
    };

    const ravi = {
      wa_id: "wa_ravi456",
      name: "Ravi Kumar",
    };

    // Sample chat messages between Neha and Ravi
    const messages = [
      {
        id: "msg1",
        wa_id: neha.wa_id,
        to: ravi.wa_id,
        name: neha.name,
        text: "Hey Ravi, how are you?",
        sent: true,
        time: "10:00",
        timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        status: "read",
      },
      {
        id: "msg2",
        wa_id: ravi.wa_id,
        to: neha.wa_id,
        name: ravi.name,
        text: "Hi Neha! I'm good, thanks. How about you?",
        sent: true,
        time: "10:02",
        timestamp: Date.now() - 1000 * 60 * 60 * 23.5, // 23.5 hours ago
        status: "read",
      },
      {
        id: "msg3",
        wa_id: neha.wa_id,
        to: ravi.wa_id,
        name: neha.name,
        text: "Doing well! Are we still on for the meeting tomorrow?",
        sent: true,
        time: "10:05",
        timestamp: Date.now() - 1000 * 60 * 60 * 23, // 23 hours ago
        status: "delivered",
      },
      {
        id: "msg4",
        wa_id: ravi.wa_id,
        to: neha.wa_id,
        name: ravi.name,
        text: "Yes, absolutely. See you then.",
        sent: true,
        time: "10:10",
        timestamp: Date.now() - 1000 * 60 * 60 * 22.5, // 22.5 hours ago
        status: "sent",
      },
      {
        id: "msg5",
        wa_id: neha.wa_id,
        to: ravi.wa_id,
        name: neha.name,
        text: "Great! Have a good day.",
        sent: true,
        time: "10:15",
        timestamp: Date.now() - 1000 * 60 * 60 * 22, // 22 hours ago
        status: "sent",
      },
    ];

    await Message.insertMany(messages);
    console.log("Seed data inserted successfully");

    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  } catch (err) {
    console.error("Error during seeding:", err);
  }
}

seed();
