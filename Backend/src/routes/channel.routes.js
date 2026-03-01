const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const channelController = require('../controllers/channel.controller');

router.use(authMiddleware);

router.get('/', channelController.getChannels);
router.post('/', channelController.createChannel);
router.delete('/:channelId', channelController.deleteChannel);

router.post('/:channelId/members', channelController.addMembers);

router.get('/:channelId/messages', channelController.getMessages);
router.post('/:channelId/messages', channelController.sendMessage);
router.patch('/:channelId/read', channelController.markAsRead);

module.exports = router;
