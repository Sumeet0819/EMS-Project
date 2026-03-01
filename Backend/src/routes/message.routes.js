const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getMessagesWithUser, sendMessage, markMessagesAsRead, getUnreadCounts, getConversations } = require('../controllers/message.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/unreads', getUnreadCounts);
router.get('/conversations', getConversations);
router.get('/:userId', getMessagesWithUser);
router.post('/', sendMessage);
router.patch('/:userId/read', markMessagesAsRead);

module.exports = router;
