const express = require('express');
const router = express.Router();
const { getConversations, getMessagesFor, sendMessage } = require('../controllers/messageController');

router.get('/conversations', getConversations);
router.get('/messages/:wa_id', getMessagesFor);
router.post('/send', sendMessage);

module.exports = router;
