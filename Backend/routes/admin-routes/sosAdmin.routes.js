const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const { getSOSLogs, resolveSOS } = require('../../controllers/userControllers/sosController');

router.use(authenticate, isAdmin);

router.get('/sos/logs', getSOSLogs);
router.put('/sos/:id/resolve', resolveSOS);

module.exports = router;
