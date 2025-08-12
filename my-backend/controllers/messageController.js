const Message = require("../models/Message");

// Utility: normalize phone numbers so IDs always match
const normalizeId = (id) => String(id || "").replace(/^\+/, "").trim();

// Get all conversations with the latest message per contact
async function getConversations(req, res) {
  try {
    const businessNumber = normalizeId(process.env.BUSINESS_PHONE_NUMBER);
    if (!businessNumber) {
      return res
        .status(500)
        .json({ error: "BUSINESS_PHONE_NUMBER is not configured" });
    }

    const conversations = await Message.aggregate([
      {
        // Only messages involving the business number, and avoid self-to-self
        $match: {
          $or: [{ wa_id: businessNumber }, { to: businessNumber }],
          $expr: { $ne: ["$wa_id", "$to"] }
        }
      },
      {
        // Determine the other participant (customer)
        $addFields: {
          otherUser: {
            $cond: [
              { $eq: ["$wa_id", businessNumber] }, // if sender is business
              "$to", // customer is receiver
              "$wa_id" // else customer is sender
            ]
          }
        }
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $project: {
          wa_id: "$_id",
          contactName: {
            $ifNull: ["$lastMessage.contact.name", "Unknown"]
          },
          lastMessage: {
            message_id: "$lastMessage.message_id",
            name: "$lastMessage.contact.name",
            text: "$lastMessage.text",
            timestamp: "$lastMessage.timestamp",
            status: "$lastMessage.status",
            sender: "$lastMessage.sender"
          },
          _id: 0
        }
      },
      { $sort: { "lastMessage.timestamp": -1 } }
    ]);

    // Normalize IDs for consistent matching on frontend
    const normalized = conversations.map((c) => ({
      ...c,
      wa_id: normalizeId(c.wa_id)
    }));

    return res.json(normalized);
  } catch (err) {
    console.error("getConversations error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

// Get all messages for a specific wa_id (chat)
async function getMessagesFor(req, res) {
  try {
    const wa_id = normalizeId(req.params.wa_id);
    const businessNumber = normalizeId(process.env.BUSINESS_PHONE_NUMBER);

    if (!businessNumber) {
      return res
        .status(500)
        .json({ error: "BUSINESS_PHONE_NUMBER is not configured" });
    }

    // Only messages between businessNumber and the given wa_id
    const msgs = await Message.find({
      $or: [
        { wa_id: wa_id, to: businessNumber },
        { wa_id: businessNumber, to: wa_id }
      ]
    }).sort({ timestamp: 1 });

    return res.json(msgs);
  } catch (err) {
    console.error("getMessagesFor error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

// Send a message from business to a contact
// Send a message from business to a contact
async function sendMessage(req, res) {
  try {
    let { wa_id, text } = req.body;
    wa_id = normalizeId(wa_id);

    if (!wa_id || !text) {
      return res.status(400).json({ error: "wa_id and text are required" });
    }

    const businessNumber = normalizeId(process.env.BUSINESS_PHONE_NUMBER);
    if (!businessNumber) {
      return res
        .status(500)
        .json({ error: "BUSINESS_PHONE_NUMBER is not configured" });
    }

    // Prevent sending message to self
    if (wa_id === businessNumber) {
      return res.status(400).json({ error: "Cannot send message to yourself" });
    }

    // Get contact name from last saved message if available
    let contactName = "Unknown";
    const lastContactMsg = await Message.findOne({
      $or: [
        { wa_id, to: businessNumber },
        { wa_id: businessNumber, to: wa_id }
      ]
    }).sort({ timestamp: -1 });

    if (lastContactMsg?.contact?.name) {
      contactName = lastContactMsg.contact.name;
    }

    const newMessage = {
      message_id: `local-${Date.now()}`,
      wa_id: businessNumber, // Always business as sender in DB
      to: wa_id, // Customer as receiver
      sender: "business",
      contact: { name: contactName, wa_id },
      metadata: {
        display_phone_number: businessNumber,
        phone_number_id: process.env.PHONE_NUMBER_ID || ""
      },
      type: "text",
      text,
      media: {},
      status: "sent",
      conversation: {
        id: `local-conv-${Date.now()}`,
        origin: "business_initiated",
        expiration_timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      pricing: {
        billable: false,
        category: "utility",
        pricing_model: "CBP",
        type: "business_initiated"
      },
      timestamp: new Date(),
      raw: {}
    };

    const savedMessage = await Message.create(newMessage);

    // Emit real-time event with customer ID as wa_id
    const io = req.app.get("io");
    if (io) {
      const chatPartnerId = normalizeId(
        savedMessage.wa_id === businessNumber
          ? savedMessage.to
          : savedMessage.wa_id
      );

      io.emit("newMessage", {
        ...savedMessage.toObject(),
        wa_id: chatPartnerId, // always the other participant for frontend
        to: normalizeId(businessNumber), // always business as 'to'
        name: contactName
      });

      console.log(
        `[SOCKET EMIT] newMessage → ${contactName} (${chatPartnerId})`
      );
    }

    return res.json({ message: savedMessage });
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ error: "server error" });
  }
}


module.exports = { getConversations, getMessagesFor, sendMessage };
