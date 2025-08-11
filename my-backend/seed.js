// seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// ==== SCHEMAS ====
const userSchema = new mongoose.Schema({
  wa_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, match: /^\d{10}$/ },
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

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected for seeding");

    // Clear existing data
    await Message.deleteMany({});
    await User.deleteMany({});

    // ==== USERS ====
    const neha = await User.create({
      wa_id: "wa_neha123",
      name: "Neha Joshi",
      phone: "9876543210",
    });

    const ravi = await User.create({
      wa_id: "wa_ravi456",
      name: "Ravi Kumar",
      phone: "9123456780",
    });

    const anjali = await User.create({
      wa_id: "wa_anjali789",
      name: "Anjali Sharma",
      phone: "9988776655",
    });

    const sameer = await User.create({
      wa_id: "wa_sameer321",
      name: "Sameer Singh",
      phone: "9012345678",
    });

    const priya = await User.create({
      wa_id: "wa_priya654",
      name: "Priya Verma",
      phone: "9001122334",
    });

    // Helper to format time
    const formatTime = (date) =>
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const now = new Date();

    // ==== MESSAGES ====
    const messages = [
      {
        id: "msg1",
        from: neha._id,
        to: ravi._id,
        text: "Hey Ravi, how are you?",
        sent: true,
        time: formatTime(new Date(now.getTime() - 1000 * 60 * 60 * 24)),
        timestamp: now.getTime() - 1000 * 60 * 60 * 24,
        status: "read",
      },
      {
        id: "msg2",
        from: ravi._id,
        to: neha._id,
        text: "Hi Neha! I'm good, thanks. How about you?",
        sent: true,
        time: formatTime(new Date(now.getTime() - 1000 * 60 * 60 * 23.5)),
        timestamp: now.getTime() - 1000 * 60 * 60 * 23.5,
        status: "read",
      },
      {
        id: "msg3",
        from: neha._id,
        to: ravi._id,
        text: "Doing well! Are we still on for the meeting tomorrow?",
        sent: true,
        time: formatTime(new Date(now.getTime() - 1000 * 60 * 60 * 23)),
        timestamp: now.getTime() - 1000 * 60 * 60 * 23,
        status: "read",
      },
      {
        id: "msg4",
        from: ravi._id,
        to: neha._id,
        text: "Yes, absolutely. See you then.",
        sent: true,
        time: formatTime(new Date(now.getTime() - 1000 * 60 * 60 * 22.5)),
        timestamp: now.getTime() - 1000 * 60 * 60 * 22.5,
        status: "read",
      },
      {
        id: "msg5",
        from: neha._id,
        to: ravi._id,
        text: "Great! Have a good day.",
        sent: true,
        time: formatTime(new Date(now.getTime() - 1000 * 60 * 60 * 22)),
        timestamp: now.getTime() - 1000 * 60 * 60 * 22,
        status: "read",
      },
      // New messages between Anjali and Sameer
      {
        id: "msg6",
        from: anjali._id,
        to: sameer._id,
        text: "Hey Sameer, did you check the report?",
        sent: true,
        time: formatTime(new Date(now.getTime() - 1000 * 60 * 60 * 10)),
        timestamp: now.getTime() - 1000 * 60 * 60 * 10,
        status: "delivered",
      },
      {
        id: "msg7",
        from: sameer._id,
        to: anjali._id,
        text: "Yes, looks good. I'll send feedback soon.",
        sent: true,
        time: formatTime(new Date(now.getTime() - 1000 * 60 * 60 * 9.5)),
        timestamp: now.getTime() - 1000 * 60 * 60 * 9.5,
        status: "read",
      },
      // One message from Priya to Neha (one sided chat)
      {
        id: "msg8",
        from: priya._id,
        to: neha._id,
        text: "Hi Neha, can we catch up this weekend?",
        sent: true,
        time: formatTime(new Date(now.getTime() - 1000 * 60 * 60 * 5)),
        timestamp: now.getTime() - 1000 * 60 * 60 * 5,
        status: "sent",
      },
    ];

    await Message.insertMany(messages);

    console.log("✅ Seed data inserted successfully");

    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  } catch (err) {
    console.error("❌ Error during seeding:", err);
  }
}

seed();
