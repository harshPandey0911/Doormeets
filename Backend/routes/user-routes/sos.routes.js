const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isUser } = require('../../middleware/roleMiddleware');
const { triggerSOS } = require('../../controllers/userControllers/sosController');

router.post('/sos', authenticate, isUser, triggerSOS);

module.exports = router;
