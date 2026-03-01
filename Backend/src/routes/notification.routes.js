const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notification.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
