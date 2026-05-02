const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const Worker = require('../../models/Worker');

/**
 * PUT /api/labour/status
 * Labour sets their status: ONLINE / OFFLINE
 */
router.put('/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body; // 'ONLINE' | 'OFFLINE'
    if (!['ONLINE', 'OFFLINE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const worker = await Worker.findByIdAndUpdate(
      req.user.id,
      { status },
      { new: true }
    ).select('name status');

    res.status(200).json({ success: true, status: worker.status, message: `You are now ${status}` });
  } catch (error) {
    console.error('[Labour] Status toggle error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

/**
 * GET /api/labour/profile
 * Get labour's own profile + stats
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id)
      .select('name phone profilePhoto serviceCategories rating totalJobs completedJobs status');
    
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Labour not found' });
    }

    res.status(200).json({ success: true, labour: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

module.exports = router;
