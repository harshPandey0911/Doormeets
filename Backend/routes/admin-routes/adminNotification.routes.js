const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  sendToUser,
  sendToAllUsers,
  sendToVendor,
  sendToAllVendors,
  sendToWorker,
  sendToAllWorkers,
  getBroadcastHistory,
  searchUsers,
  searchVendors,
  searchWorkers,
  deleteNotification
} = require('../../controllers/adminControllers/adminNotificationController');

// All routes require admin auth
router.use(authenticate, isAdmin);

// ── Send Notifications ──────────────────────────────────────────────────────
// Send to a specific user
router.post('/send-to-user', sendToUser);

// Broadcast to all users
router.post('/send-to-all-users', sendToAllUsers);

// Send to a specific vendor
router.post('/send-to-vendor', sendToVendor);

// Broadcast to all vendors
router.post('/send-to-all-vendors', sendToAllVendors);

// Send to a specific worker
router.post('/send-to-worker', sendToWorker);

// Broadcast to all workers
router.post('/send-to-all-workers', sendToAllWorkers);

// ── History & Search ────────────────────────────────────────────────────────
// Get broadcast history (notifications sent by admin)
router.get('/broadcast-history', getBroadcastHistory);

// Search users for targeting
router.get('/search-users', searchUsers);

// Search vendors for targeting
router.get('/search-vendors', searchVendors);

// Search workers for targeting
router.get('/search-workers', searchWorkers);

// Delete broadcast notification
router.delete('/:id', deleteNotification);

module.exports = router;
