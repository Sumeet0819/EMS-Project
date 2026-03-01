const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getAnnouncements, createAnnouncement, deleteAnnouncement } = require('../controllers/announcement.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAnnouncements);
router.post('/', createAnnouncement); // Add admin check internally
router.delete('/:id', deleteAnnouncement); // Add admin check internally

module.exports = router;
