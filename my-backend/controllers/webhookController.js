const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const { processPayload } = require('../utils/processWebhook');

/**
 * Save message events from webhook payload
 */
async function saveMessagesFromPayload(payload, businessNumber) {
  const value = payload.entry?.[0]?.changes?.[0]?.value || {};
  const messages = value.messages || [];
  const contacts = value.contacts || [];
  const metadata = value.metadata || {};

  if (!messages.length) return;

  for (const msg of messages) {
    const from = msg.from; // sender WA ID
    const isBusiness = from === businessNumber;

    // Figure out the other participant's wa_id
    const contactWaId = isBusiness ? (msg.to || contacts[0]?.wa_id) : from;

    // Find the contact's name
    let contactName = 'Unknown';
    const matchedContact = contacts.find(c => c.wa_id === contactWaId);
    if (matchedContact?.profile?.name) {
      contactName = matchedContact.profile.name;
    }

    await Message.updateOne(
      { message_id: msg.id },
      {
        $setOnInsert: {
          message_id: msg.id || `local-${Date.now()}`,
          wa_id: from,
          to: isBusiness ? contactWaId : businessNumber || null,
          sender: isBusiness ? 'business' : 'customer',
          timestamp: new Date(Number(msg.timestamp) * 1000),
          type: msg.type || 'text',
          status: 'received'
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
 * Update statuses from webhook payload
 */
async function updateStatusFromPayload(payload) {
  const value = payload.entry?.[0]?.changes?.[0]?.value || {};
  const statuses = value.statuses || [];
  const metadata = value.metadata || {};

  if (!statuses.length) return;

  for (const st of statuses) {
    await Message.updateOne(
      { message_id: st.id || st.meta_msg_id },
      {
        $set: {
          status: st.status || 'unknown',
          conversation: st.conversation
            ? {
                id: st.conversation.id || '',
                origin: st.conversation.origin?.type || 'unknown',
                expiration_timestamp: st.conversation.expiration_timestamp
                  ? new Date(Number(st.conversation.expiration_timestamp) * 1000)
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

/**
 * POST /webhook → Live webhook from WhatsApp
 */
async function receiveWebhook(req, res) {
  try {
    const businessNumber = process.env.BUSINESS_PHONE_NUMBER || null;
    const payload = req.body;

    // Process message events
    if (payload.entry?.[0]?.changes?.[0]?.value?.messages) {
      await saveMessagesFromPayload(payload, businessNumber);
    }

    // Process status events
    if (payload.entry?.[0]?.changes?.[0]?.value?.statuses) {
      await updateStatusFromPayload(payload);
    }

    // Optional: Run custom parser
    await processPayload(payload, businessNumber);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('receiveWebhook error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

/**
 * POST /webhook/process-file → Simulate webhook from stored JSON file
 */
async function processFile(req, res) {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename required' });

    const filePath = path.join(__dirname, '..', 'webhooks', filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'file not found' });

    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const businessNumber = process.env.BUSINESS_PHONE_NUMBER || null;

    if (payload.entry?.[0]?.changes?.[0]?.value?.messages) {
      await saveMessagesFromPayload(payload, businessNumber);
    }
    if (payload.entry?.[0]?.changes?.[0]?.value?.statuses) {
      await updateStatusFromPayload(payload);
    }

    await processPayload(payload, businessNumber);

    return res.json({ ok: true, processed: filename });
  } catch (err) {
    console.error('processFile error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = { receiveWebhook, processFile };
