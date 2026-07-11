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
  sendBroadcastToAllUsers,
  sendBroadcastToAllVendors
} = require('../../services/firebaseAdmin');

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
        message: 'userId, title aur body required hain'
      });
    }

    const user = await User.findById(userId).select('name phone fcmTokens fcmTokenMobile');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nahi mila' });
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
      message: `Notification "${title}" user ${user.name} ko bheji gayi`,
      notification
    });
  } catch (error) {
    console.error('[Admin Notif] sendToUser error:', error);
    res.status(500).json({ success: false, message: 'Notification bhejne mein error aaya' });
  }
};

// ─── 2. Broadcast to ALL Users ────────────────────────────────────────────────
const sendToAllUsers = async (req, res) => {
  try {
    const { title, body, imageUrl, actionUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'title aur body required hain'
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
      message: `Broadcast "${title}" ${result.totalUsers} users ko bheja gaya`,
      stats: result,
      notificationId: notification._id
    });
  } catch (error) {
    console.error('[Admin Notif] sendToAllUsers error:', error);
    res.status(500).json({ success: false, message: 'Broadcast bhejne mein error aaya' });
  }
};

// ─── 3. Send notification to a specific Vendor ───────────────────────────────
const sendToVendor = async (req, res) => {
  try {
    const { vendorId, title, body, imageUrl, actionUrl } = req.body;

    if (!vendorId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'vendorId, title aur body required hain'
      });
    }

    const vendor = await Vendor.findById(vendorId).select('name businessName fcmTokens fcmTokenMobile');
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor nahi mila' });
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
      message: `Notification "${title}" vendor ${vendorName} ko bheji gayi`,
      notification
    });
  } catch (error) {
    console.error('[Admin Notif] sendToVendor error:', error);
    res.status(500).json({ success: false, message: 'Notification bhejne mein error aaya' });
  }
};

// ─── 4. Broadcast to ALL Vendors ─────────────────────────────────────────────
const sendToAllVendors = async (req, res) => {
  try {
    const { title, body, imageUrl, actionUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'title aur body required hain'
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
      message: `Broadcast "${title}" ${result.totalVendors} vendors ko bheja gaya`,
      stats: result,
      notificationId: notification._id
    });
  } catch (error) {
    console.error('[Admin Notif] sendToAllVendors error:', error);
    res.status(500).json({ success: false, message: 'Broadcast bhejne mein error aaya' });
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
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Kam se kam 2 characters likho' });
    }

    const users = await User.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name phone email profilePhoto')
      .limit(10)
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
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Kam se kam 2 characters likho' });
    }

    const vendors = await Vendor.find({
      isActive: true,
      $or: [
        { businessName: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name businessName phone')
      .limit(10)
      .lean();

    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    console.error('[Admin Notif] searchVendors error:', error);
    res.status(500).json({ success: false, message: 'Vendor search mein error aaya' });
  }
};

module.exports = {
  sendToUser,
  sendToAllUsers,
  sendToVendor,
  sendToAllVendors,
  getBroadcastHistory,
  searchUsers,
  searchVendors
};
