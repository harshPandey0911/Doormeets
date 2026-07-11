/**
 * Admin Notification Controller
 * Allows admins to send targeted or broadcast push notifications
 * to users and/or vendors — Zomato-style with image & URL support.
 */

const Notification = require('../../models/Notification');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');
const {
  sendNotificationToUser,
  sendNotificationToVendor,
  sendNotificationToWorker,
  sendBroadcastToAllUsers,
  sendBroadcastToAllVendors,
  sendBroadcastToAllWorkers
} = require('../../services/firebaseAdmin');
const mongoose = require('mongoose');
const Worker = mongoose.models.Worker || mongoose.model('Worker');

// ─── Helper: build FCM payload from admin form data ─────────────────────────
function buildFCMPayload({ title, body, imageUrl, actionUrl }) {
  return {
    title,
    body,
    imageUrl: imageUrl || null,
    actionUrl: actionUrl || null,
    highPriority: true,
    data: {
      type: 'admin_broadcast',
      ...(actionUrl && { actionUrl }),
      ...(imageUrl && { imageUrl })
    }
  };
}

// ─── 1. Send notification to a specific User ─────────────────────────────────
const sendToUser = async (req, res) => {
  try {
    const { userId, title, body, imageUrl, actionUrl } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, and body are required'
      });
    }

    const user = await User.findById(userId).select('name phone fcmTokens fcmTokenMobile');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Save notification to DB
    const notification = await Notification.create({
      userId,
      type: 'admin_broadcast',
      title,
      message: body,
      imageUrl: imageUrl || null,
      actionUrl: actionUrl || null,
      data: { sentBy: req.user?.id, targetType: 'specific_user' }
    });

    // Send FCM push
    const payload = buildFCMPayload({ title, body, imageUrl, actionUrl });
    await sendNotificationToUser(userId, payload);

    console.log(`[Admin Notif] Sent to user: ${user.name} (${userId})`);

    res.status(200).json({
      success: true,
      message: `Notification "${title}" sent to user ${user.name}`,
      notification
    });
  } catch (error) {
    console.error('[Admin Notif] sendToUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
};

// ─── 2. Broadcast to ALL Users ────────────────────────────────────────────────
const sendToAllUsers = async (req, res) => {
  try {
    const { title, body, imageUrl, actionUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'title and body are required'
      });
    }

    const payload = buildFCMPayload({ title, body, imageUrl, actionUrl });

    // Save a single "broadcast" record in DB
    const notification = await Notification.create({
      type: 'admin_broadcast',
      title,
      message: body,
      imageUrl: imageUrl || null,
      actionUrl: actionUrl || null,
      data: {
        sentBy: req.user?.id,
        targetType: 'all_users',
        isBroadcast: true
      }
    });

    // Run broadcast async (can take time for large user bases)
    const result = await sendBroadcastToAllUsers(payload);

    console.log(`[Admin Notif] Broadcast to all users: Success=${result.successCount}, Failed=${result.failureCount}`);

    res.status(200).json({
      success: true,
      message: `Broadcast "${title}" sent to ${result.totalUsers} users`,
      stats: result,
      notificationId: notification._id
    });
  } catch (error) {
    console.error('[Admin Notif] sendToAllUsers error:', error);
    res.status(500).json({ success: false, message: 'Failed to send broadcast notification' });
  }
};

// ─── 3. Send notification to a specific Vendor ───────────────────────────────
const sendToVendor = async (req, res) => {
  try {
    const { vendorId, title, body, imageUrl, actionUrl } = req.body;

    if (!vendorId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'vendorId, title, and body are required'
      });
    }

    const vendor = await Vendor.findById(vendorId).select('name businessName fcmTokens fcmTokenMobile');
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const notification = await Notification.create({
      vendorId,
      type: 'admin_broadcast',
      title,
      message: body,
      imageUrl: imageUrl || null,
      actionUrl: actionUrl || null,
      data: { sentBy: req.user?.id, targetType: 'specific_vendor' }
    });

    const payload = buildFCMPayload({ title, body, imageUrl, actionUrl });
    await sendNotificationToVendor(vendorId, payload);

    const vendorName = vendor.businessName || vendor.name;
    console.log(`[Admin Notif] Sent to vendor: ${vendorName} (${vendorId})`);

    res.status(200).json({
      success: true,
      message: `Notification "${title}" sent to vendor ${vendorName}`,
      notification
    });
  } catch (error) {
    console.error('[Admin Notif] sendToVendor error:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
};

// ─── 4. Broadcast to ALL Vendors ─────────────────────────────────────────────
const sendToAllVendors = async (req, res) => {
  try {
    const { title, body, imageUrl, actionUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'title and body are required'
      });
    }

    const payload = buildFCMPayload({ title, body, imageUrl, actionUrl });

    const notification = await Notification.create({
      type: 'admin_broadcast',
      title,
      message: body,
      imageUrl: imageUrl || null,
      actionUrl: actionUrl || null,
      data: {
        sentBy: req.user?.id,
        targetType: 'all_vendors',
        isBroadcast: true
      }
    });

    const result = await sendBroadcastToAllVendors(payload);

    console.log(`[Admin Notif] Broadcast to all vendors: Success=${result.successCount}, Failed=${result.failureCount}`);

    res.status(200).json({
      success: true,
      message: `Broadcast "${title}" sent to ${result.totalVendors} vendors`,
      stats: result,
      notificationId: notification._id
    });
  } catch (error) {
    console.error('[Admin Notif] sendToAllVendors error:', error);
    res.status(500).json({ success: false, message: 'Failed to send broadcast notification' });
  }
};

// ─── 5. Get Admin Broadcast History ──────────────────────────────────────────
const getBroadcastHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch admin_broadcast notifications (no userId/vendorId = broadcast, others = targeted)
    const notifications = await Notification.find({ type: 'admin_broadcast' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments({ type: 'admin_broadcast' });

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Admin Notif] getBroadcastHistory error:', error);
    res.status(500).json({ success: false, message: 'History fetch karne mein error aaya' });
  }
};

// ─── 6. Search Users for targeting ───────────────────────────────────────────
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    let queryObj = { isActive: true };

    if (q && q.trim().length >= 1) {
      queryObj.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { phone: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } }
      ];
    }

    const users = await User.find(queryObj)
      .select('name phone email profilePhoto')
      .limit(30)
      .lean();

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('[Admin Notif] searchUsers error:', error);
    res.status(500).json({ success: false, message: 'User search mein error aaya' });
  }
};

// ─── 7. Search Vendors for targeting ─────────────────────────────────────────
const searchVendors = async (req, res) => {
  try {
    const { q } = req.query;
    let queryObj = { isActive: true };

    if (q && q.trim().length >= 1) {
      queryObj.$or = [
        { businessName: { $regex: q.trim(), $options: 'i' } },
        { name: { $regex: q.trim(), $options: 'i' } },
        { phone: { $regex: q.trim(), $options: 'i' } }
      ];
    }

    const vendors = await Vendor.find(queryObj)
      .select('name businessName phone')
      .limit(30)
      .lean();

    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    console.error('[Admin Notif] searchVendors error:', error);
    res.status(500).json({ success: false, message: 'Vendor search mein error aaya' });
  }
};

// ─── 8. Delete a Broadcast Notification ──────────────────────────────────────
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('[Admin Notif] deleteNotification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

// ─── 9. Send notification to a specific Worker ───────────────────────────────
const sendToWorker = async (req, res) => {
  try {
    const { workerId, title, body, imageUrl, actionUrl } = req.body;

    if (!workerId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'workerId, title, and body are required'
      });
    }

    const worker = await Worker.findById(workerId).select('name phone fcmTokens fcmTokenMobile');
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const notification = await Notification.create({
      workerId,
      type: 'admin_broadcast',
      title,
      message: body,
      imageUrl: imageUrl || null,
      actionUrl: actionUrl || null,
      data: { sentBy: req.user?.id, targetType: 'specific_worker' }
    });

    const payload = buildFCMPayload({ title, body, imageUrl, actionUrl });
    await sendNotificationToWorker(workerId, payload);

    console.log(`[Admin Notif] Sent to worker: ${worker.name} (${workerId})`);

    res.status(200).json({
      success: true,
      message: `Notification "${title}" sent to worker ${worker.name}`,
      notification
    });
  } catch (error) {
    console.error('[Admin Notif] sendToWorker error:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
};

// ─── 10. Broadcast to ALL Workers ─────────────────────────────────────────────
const sendToAllWorkers = async (req, res) => {
  try {
    const { title, body, imageUrl, actionUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'title and body are required'
      });
    }

    const payload = buildFCMPayload({ title, body, imageUrl, actionUrl });

    const notification = await Notification.create({
      type: 'admin_broadcast',
      title,
      message: body,
      imageUrl: imageUrl || null,
      actionUrl: actionUrl || null,
      data: {
        sentBy: req.user?.id,
        targetType: 'all_workers',
        isBroadcast: true
      }
    });

    const result = await sendBroadcastToAllWorkers(payload);

    console.log(`[Admin Notif] Broadcast to all workers: Success=${result.successCount}, Failed=${result.failureCount}`);

    res.status(200).json({
      success: true,
      message: `Broadcast "${title}" sent to ${result.totalWorkers} workers`,
      stats: result,
      notificationId: notification._id
    });
  } catch (error) {
    console.error('[Admin Notif] sendToAllWorkers error:', error);
    res.status(500).json({ success: false, message: 'Failed to send broadcast notification' });
  }
};

// ─── 11. Search Workers for targeting ─────────────────────────────────────────
const searchWorkers = async (req, res) => {
  try {
    const { q } = req.query;
    let queryObj = {};

    if (q && q.trim().length >= 1) {
      queryObj.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { phone: { $regex: q.trim(), $options: 'i' } }
      ];
    }

    const workers = await Worker.find(queryObj)
      .select('name phone')
      .limit(30)
      .lean();

    res.status(200).json({ success: true, data: workers });
  } catch (error) {
    console.error('[Admin Notif] searchWorkers error:', error);
    res.status(500).json({ success: false, message: 'Worker search mein error aaya' });
  }
};

module.exports = {
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
};
