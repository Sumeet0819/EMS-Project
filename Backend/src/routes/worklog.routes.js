const express = require('express');
const router = express.Router();
const workLogController = require('../controllers/worklog.controller');
const isAuthenticated = require('../middleware/auth.middleware');

router.use(isAuthenticated);

router.get('/today', workLogController.getTodayLog);
router.post('/start', workLogController.startDay);
router.post('/stop', workLogController.stopDay);
router.get('/stats', workLogController.getWorkLogStats);

module.exports = router;
