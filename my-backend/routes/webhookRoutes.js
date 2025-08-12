const express = require('express');
const router = express.Router();
const { receiveWebhook, processFile } = require('../controllers/webhookController');

// Endpoint WhatsApp would call in production
router.post('/webhook', receiveWebhook);

// Developer-only: process a JSON file from /webhooks by filename
router.post('/webhook/process-file', processFile);

module.exports = router;