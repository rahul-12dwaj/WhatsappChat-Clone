const Message = require('../models/Message');

// Utility: normalize phone numbers (remove +, trim spaces)
const normalizeId = (id) => String(id || "").replace(/^\+/, "").trim();

/**
 * Process a webhook payload and insert/update messages in DB.
 * Handles both message events and status events in structured schema.
 */
async function processPayload(payload, businessNumberRaw) {
  const businessNumber = normalizeId(businessNumberRaw);

  // Handle both "metaData" style (from your JSON files) and direct "entry"
  const entry = payload?.metaData?.entry?.[0] || payload?.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  if (!change) {
    throw new Error('Unexpected payload format');
  }

  const metadata = change.metadata || {};

  /**
   * MESSAGE EVENTS
   */
  if (change.messages && Array.isArray(change.messages)) {
    for (const msg of change.messages) {
      const msgFrom = normalizeId(msg.from);
      const msgTo = normalizeId(msg.to);
      const isBusiness = msgFrom === businessNumber;

      // Contact details (the other participant)
      const contactWaId = isBusiness
        ? msgTo || normalizeId(change.contacts?.[0]?.wa_id)
        : msgFrom;

      const contactName =
        change.contacts?.find(c => normalizeId(c.wa_id) === contactWaId)?.profile?.name ||
        'Unknown';

      const messageId = msg.id || msg._id || msg?.key?.id;
      const timestampSec = Number(msg.timestamp) || Number(msg.t) || 0;

      await Message.updateOne(
        { message_id: messageId },
        {
          $setOnInsert: {
            message_id: messageId,
            wa_id: msgFrom,
            to: isBusiness ? contactWaId : businessNumber,
            sender: isBusiness ? 'business' : 'customer',
            timestamp: timestampSec
              ? new Date(timestampSec * 1000)
              : new Date(),
            type: msg.type || 'text',
            status: isBusiness ? 'sent' : 'received'
          },
          $set: {
            contact: {
              name: contactName,
              wa_id: contactWaId
            },
            metadata: {
              display_phone_number: metadata.display_phone_number || '',
              phone_number_id: metadata.phone_number_id || ''
            },
            text: msg.text?.body || '',
            media: msg.image
              ? {
                  media_id: msg.image.id,
                  mime_type: msg.image.mime_type,
                  sha256: msg.image.sha256,
                  caption: msg.image.caption || ''
                }
              : undefined,
            raw: msg
          }
        },
        { upsert: true }
      );
    }
  }

  /**
   * STATUS EVENTS
   */
  if (change.statuses && Array.isArray(change.statuses)) {
    for (const st of change.statuses) {
      const messageId = st.id || st.meta_msg_id;
      if (!messageId) continue;

      await Message.updateOne(
        { message_id: messageId },
        {
          $set: {
            status: st.status || 'unknown',
            conversation: st.conversation
              ? {
                  id: st.conversation.id || '',
                  origin: st.conversation.origin?.type || 'unknown',
                  expiration_timestamp: st.conversation.expiration_timestamp
                    ? new Date(
                        Number(st.conversation.expiration_timestamp) * 1000
                      )
                    : undefined
                }
              : undefined,
            pricing: st.pricing
              ? {
                  billable: st.pricing.billable,
                  category: st.pricing.category,
                  pricing_model: st.pricing.pricing_model,
                  type: st.pricing.type
                }
              : undefined,
            metadata: {
              display_phone_number: metadata.display_phone_number || '',
              phone_number_id: metadata.phone_number_id || ''
            }
          }
        }
      );
    }
  }
}

module.exports = { processPayload };
