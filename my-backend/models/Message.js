const { Schema, model } = require('mongoose');

const PricingSchema = new Schema({
  billable: Boolean,
  category: String,
  pricing_model: String,
  type: String
}, { _id: false });

const ConversationSchema = new Schema({
  id: String,
  origin: {
    type: String,
    enum: ['user_initiated', 'business_initiated', 'referral', 'unknown'],
    default: 'unknown'
  },
  expiration_timestamp: Date
}, { _id: false });

const MetadataSchema = new Schema({
  display_phone_number: String,
  phone_number_id: String
}, { _id: false });

const ContactSchema = new Schema({
  name: String,
  wa_id: String
}, { _id: false });

const MessageSchema = new Schema({
  // Core identifiers
  message_id: { type: String, index: true, unique: true }, 
  wa_id: { type: String, required: true },     // sender WhatsApp ID
  to: { type: String, required: true },        // recipient WhatsApp ID
  sender: { type: String, enum: ['business', 'customer'], default: 'customer' },

  // Contact & metadata
  contact: ContactSchema,
  metadata: MetadataSchema,

  // Message content
  type: { type: String, enum: ['text', 'image', 'video', 'audio', 'document', 'unknown'], default: 'text' },
  text: { type: String },
  media: {
    media_id: String,
    mime_type: String,
    sha256: String,
    caption: String
  },

  // Status & conversation tracking
  status: { type: String, enum: ['sent', 'delivered', 'read', 'received', 'unknown'], default: 'unknown' },
  conversation: ConversationSchema,
  pricing: PricingSchema,

  // Timing
  timestamp: { type: Date, default: Date.now },

  // Original webhook payload for debugging/auditing
  raw: { type: Object }
}, { timestamps: true });

// Explicitly set collection name to processed_messages
module.exports = model('Message', MessageSchema, 'processed_messages');
