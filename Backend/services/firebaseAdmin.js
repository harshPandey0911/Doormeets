/**
 * Firebase Admin Service
 * Handles push notification sending via Firebase Cloud Messaging (FCM)
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// Initialize Firebase Admin SDK
let serviceAccount;

try {
  if (process.env.FIREBASE_CONFIG) {
    // Production: Use environment variable JSON content
    serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Alternative Env Var
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    // Local: Use file path
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './config/firebase-service-account.json';
    serviceAccount = require(path.resolve(__dirname, '..', serviceAccountPath));
  }
} catch (error) {
  console.error('❌ Failed to load Firebase credentials:', error.message);
}

// Initialize only if not already initialized
if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized');
}

/**
 * Send push notification to multiple tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {Object} payload - Notification payload
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {Object} payload.data - Additional data (optional)
 * @param {string} payload.icon - Notification icon (optional)
 * @param {boolean} payload.highPriority - Send as high priority (default: true)
 * @returns {Promise<Object>} - Response with success/failure counts
 */
/**
 * Send push notification to multiple tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {Object} payload - Notification payload
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {Object} payload.data - Additional data (optional)
 * @param {string} payload.icon - Notification icon (optional)
 * @param {boolean} payload.highPriority - Send as high priority (default: true)
 * @returns {Promise<Object>} - Response with success/failure counts
 */
async function sendPushNotification(tokens, payload) {
  try {
    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens provided');
      return { successCount: 0, failureCount: 0 };
    }

    // Remove duplicates and empty values (Robust deduplication)
    const uniqueTokens = Array.from(new Set(tokens.filter(t => t && typeof t === 'string' && t.trim().length > 0)));

    if (uniqueTokens.length === 0) {
      console.log('No valid FCM tokens after filtering');
      return { successCount: 0, failureCount: 0 };
    }

    // Ensure data values are strings (FCM requirement)
    const stringData = {
      // Always include title and body in data for data-only notifications and Service Worker access
      title: payload.title || (payload.body ? 'New Update' : 'App Notification'),
      body: payload.body || ''
    };
    if (payload.imageUrl) {
      stringData.imageUrl = String(payload.imageUrl);
      stringData.image = String(payload.imageUrl);
    }
    if (payload.actionUrl) {
      stringData.actionUrl = String(payload.actionUrl);
      stringData.link = String(payload.actionUrl);
      stringData.url = String(payload.actionUrl);
    }
    if (payload.data) {
      Object.keys(payload.data).forEach(key => {
        stringData[key] = String(payload.data[key]);
      });
    }

    const message = {
      data: stringData,
      tokens: uniqueTokens,
      // Add top-level notification for default native mobile tray render (HTTP v1 format uses "image")
      notification: {
        title: payload.title || 'App Notification',
        body: payload.body || 'New Update',
        image: payload.imageUrl || undefined
      },
      // Android specific configuration for high priority
      android: {
        priority: 'high',
        notification: {
          title: payload.title || 'App Notification',
          body: payload.body || 'New Update',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          icon: 'stock_ticker_update',
          color: '#f44336',
          imageUrl: payload.imageUrl || undefined
        }
      },
      // iOS/APNs specific configuration
      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert'
        },
        payload: {
          aps: {
            alert: {
              title: payload.title || 'App Notification',
              body: payload.body || 'New Update'
            },
            sound: 'default',
            badge: 1,
            'content-available': 1,
            'mutable-content': 1
          }
        },
        fcmOptions: {
          imageUrl: payload.imageUrl || undefined
        }
      },
      // Web push configuration
      webpush: {
        headers: {
          Urgency: 'high',
          TTL: '86400'
        },
        fcmOptions: {
          link: payload.data?.link || '/'
        }
      },
      priority: payload.highPriority !== false ? 'high' : 'normal'
    };

    // Ensure critical fields are also in data for background handling and to prevent double notifications.
    message.data.title = payload.title || 'App Notification';
    message.data.body = payload.body || 'New Update';
    if (payload.icon) message.data.icon = payload.icon;
    if (payload.imageUrl) {
      message.data.imageUrl = payload.imageUrl;
      message.data.image = payload.imageUrl;
    }
    if (payload.actionUrl) {
      message.data.actionUrl = payload.actionUrl;
      message.data.link = payload.actionUrl;
      message.data.url = payload.actionUrl;
    }

    // Force top-level notification.image parameter to be set cleanly
    if (!message.notification) {
      message.notification = {};
    }
    message.notification.title = payload.title || 'App Notification';
    message.notification.body = payload.body || 'New Update';
    message.notification.image = payload.imageUrl || undefined;

    // Explicitly add webpush notification structure if title/body/image are present
    // Browsers natively require webpush.notification or service worker image options to show rich image payloads
    message.webpush.notification = {
      title: payload.title || 'App Notification',
      body: payload.body || 'New Update',
      icon: payload.icon || '/vite.svg',
      badge: '/vite.svg',
      image: payload.imageUrl || undefined
    };

    // Log intent
    console.log(`[FCM] Sending standard notification to ${uniqueTokens.length} tokens:`, payload.title);

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(`✅ Push notification sent - Success: ${response.successCount}, Failed: ${response.failureCount}`);

    // Log failed tokens for debugging and cleanup invalid ones
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          console.log(`❌ Failed token[${idx}]: ${errorCode} - ${resp.error?.message}`);

          if (errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token') {
            invalidTokens.push(uniqueTokens[idx]);
          }
        }
      });

      // Cleanup invalid tokens
      if (invalidTokens.length > 0) {
        removeInvalidTokens(invalidTokens);
      }
    }

    return response;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    throw error;
  }
}

/**
 * Remove invalid FCM tokens from all collections
 * @param {string[]} tokens - Array of invalid tokens to remove
 */
async function removeInvalidTokens(tokens) {
  try {
    console.log(`[FCM Cleanup] Removing ${tokens.length} invalid tokens...`);
    const User = require('../models/User');
    const Vendor = require('../models/Vendor');
    const mongoose = require('mongoose');
    const Worker = mongoose.model('Worker');

    const updateQuery = {
      $pull: {
        fcmTokens: { $in: tokens },
        fcmTokenMobile: { $in: tokens }
      }
    };

    // We run updates in parallel for all collections as a token might belong to any
    await Promise.all([
      User.updateMany({ $or: [{ fcmTokens: { $in: tokens } }, { fcmTokenMobile: { $in: tokens } }] }, updateQuery),
      Vendor.updateMany({ $or: [{ fcmTokens: { $in: tokens } }, { fcmTokenMobile: { $in: tokens } }] }, updateQuery),
      Worker.updateMany({ $or: [{ fcmTokens: { $in: tokens } }, { fcmTokenMobile: { $in: tokens } }] }, updateQuery)
    ]);

    console.log('[FCM Cleanup] ✅ Invalid tokens removed from database');
  } catch (err) {
    console.error('[FCM Cleanup] ❌ Error removing tokens:', err);
  }
}

/**
 * Send notification to a specific user
 * @param {string} userId - User's MongoDB _id
 * @param {Object} payload - Notification payload
 * @param {boolean} includeMobile - Include mobile tokens (default: true)
 */
async function sendNotificationToUser(userId, payload, includeMobile = true) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      console.log(`[FCM] ❌ User not found for notification: ${userId}`);
      return;
    }

    let tokens = [];
    if (user.fcmTokens && user.fcmTokens.length > 0) {
      tokens = [...tokens, ...user.fcmTokens];
    }
    if (includeMobile && user.fcmTokenMobile && user.fcmTokenMobile.length > 0) {
      tokens = [...tokens, ...user.fcmTokenMobile];
    }

    if (tokens.length === 0) {
      console.log(`[FCM] ⚠️ No FCM tokens found for user: ${userId}`);
      return;
    }

    console.log(`[FCM] 📤 Sending notification to user ${user.name} (${userId}) on ${tokens.length} devices`);

    // Add priority and sound for user notifications too
    const finalPayload = {
      ...payload,
      highPriority: payload.priority === 'high' ||
        ['booking_accepted', 'worker_started', 'journey_started', 'work_done', 'work_completed', 'booking_completed', 'vendor_reached', 'visit_verified', 'payment_success', 'payment_received', 'work_started', 'in_progress', 'worker_accepted'].includes(payload.data?.type),
      dataOnly: false // Explicitly disable dataOnly to force system tray notification
    };

    await sendPushNotification(tokens, finalPayload);
  } catch (error) {
    console.error(`[FCM] ❌ Error sending notification to user ${userId}:`, error);
  }
}

/**
 * Send notification to a specific vendor
 * @param {string} vendorId - Vendor's MongoDB _id
 * @param {Object} payload - Notification payload
 * @param {boolean} includeMobile - Include mobile tokens (default: true)
 */
async function sendNotificationToVendor(vendorId, payload, includeMobile = true) {
  try {
    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      console.log(`[FCM] ❌ Vendor not found for notification: ${vendorId}`);
      return;
    }

    let tokens = [];
    if (vendor.fcmTokens && vendor.fcmTokens.length > 0) {
      tokens = [...tokens, ...vendor.fcmTokens];
    }
    if (includeMobile && vendor.fcmTokenMobile && vendor.fcmTokenMobile.length > 0) {
      tokens = [...tokens, ...vendor.fcmTokenMobile];
    }

    if (tokens.length === 0) {
      console.log(`[FCM] ⚠️ No FCM tokens found for vendor: ${vendorId}`);
      return;
    }

    console.log(`[FCM] 📤 Sending notification to vendor ${vendor.businessName || vendor.name} (${vendorId}) on ${tokens.length} devices`);

    const finalPayload = {
      ...payload,
      title: `🏢 [Partner] ${payload.title}` // Add identification
    };

    await sendPushNotification(tokens, finalPayload);
  } catch (error) {
    console.error(`[FCM] ❌ Error sending notification to vendor ${vendorId}:`, error);
  }
}

/**
 * Send notification to a specific worker
 * @param {string} workerId - Worker's MongoDB _id
 * @param {Object} payload - Notification payload
 * @param {boolean} includeMobile - Include mobile tokens (default: true)
 */
async function sendNotificationToWorker(workerId, payload, includeMobile = true) {
  try {
    const mongoose = require('mongoose');
    const Worker = mongoose.model('Worker');
    const worker = await Worker.findById(workerId);

    if (!worker) {
      console.log(`[FCM] ❌ Worker not found for notification: ${workerId}`);
      return;
    }

    let tokens = [];
    if (worker.fcmTokens && worker.fcmTokens.length > 0) {
      tokens = [...tokens, ...worker.fcmTokens];
    }
    if (includeMobile && worker.fcmTokenMobile && worker.fcmTokenMobile.length > 0) {
      tokens = [...tokens, ...worker.fcmTokenMobile];
    }

    if (tokens.length === 0) {
      console.log(`[FCM] ⚠️ No FCM tokens found for worker: ${workerId}`);
      return;
    }

    console.log(`[FCM] 📤 Sending notification to worker ${worker.name} (${workerId}) on ${tokens.length} devices`);

    const finalPayload = {
      ...payload,
      title: `👷 [Pro] ${payload.title}` // Add identification
    };

    await sendPushNotification(tokens, finalPayload);
  } catch (error) {
    console.error(`[FCM] ❌ Error sending notification to worker ${workerId}:`, error);
  }
}

/**
 * Send notification to a specific admin
 * @param {string} adminId - Admin's MongoDB _id
 * @param {Object} payload - Notification payload
 * @param {boolean} includeMobile - Include mobile tokens (default: true)
 */
async function sendNotificationToAdmin(adminId, payload, includeMobile = true) {
  try {
    const User = require('../models/User'); // Use User model for admin too as they share collection or separate Admin model?

    let adminUser = null;
    try {
      const Admin = require('../models/Admin');
      adminUser = await Admin.findById(adminId);
    } catch (e) {
      // If Admin model doesn't exist, try User model with role check?
      // Or maybe adminId refers to a User document.
      const User = require('../models/User');
      adminUser = await User.findById(adminId);
    }

    if (!adminUser) {
      console.log(`Admin not found: ${adminId}`);
      return;
    }

    let tokens = [];
    if (adminUser.fcmTokens && adminUser.fcmTokens.length > 0) {
      tokens = [...tokens, ...adminUser.fcmTokens];
    }
    if (includeMobile && adminUser.fcmTokenMobile && adminUser.fcmTokenMobile.length > 0) {
      tokens = [...tokens, ...adminUser.fcmTokenMobile];
    }

    console.log(`[FCM] 📤 Sending notification to admin (${adminId}) on ${tokens.length} devices`);

    const finalPayload = {
      ...payload,
      title: `🛡️ [Admin] ${payload.title}` // Add identification
    };

    await sendPushNotification(tokens, finalPayload);
  } catch (error) {
    console.error(`[FCM] ❌ Error sending notification to admin ${adminId}:`, error);
  }
}

/**
 * Send broadcast push notification to ALL users
 * Fetches all users with FCM tokens and sends in batches of 500
 * @param {Object} payload - Notification payload (title, body, imageUrl, actionUrl, data)
 * @returns {Promise<Object>} - { totalUsers, totalTokens, successCount, failureCount }
 */
async function sendBroadcastToAllUsers(payload) {
  try {
    const User = require('../models/User');
    console.log('[FCM Broadcast] Fetching all users with FCM tokens...');

    // Fetch only users with at least one FCM token
    const users = await User.find({
      isActive: true,
      $or: [
        { fcmTokens: { $exists: true, $not: { $size: 0 } } },
        { fcmTokenMobile: { $exists: true, $not: { $size: 0 } } }
      ]
    }).select('fcmTokens fcmTokenMobile name');

    if (!users || users.length === 0) {
      console.log('[FCM Broadcast] No users with FCM tokens found');
      return { totalUsers: 0, totalTokens: 0, successCount: 0, failureCount: 0 };
    }

    // Collect all unique tokens
    const allTokens = [];
    users.forEach(user => {
      if (user.fcmTokens) allTokens.push(...user.fcmTokens);
      if (user.fcmTokenMobile) allTokens.push(...user.fcmTokenMobile);
    });

    const uniqueTokens = [...new Set(allTokens.filter(t => t && t.trim()))]; 
    console.log(`[FCM Broadcast] Found ${users.length} users, ${uniqueTokens.length} unique tokens`);

    // Send in batches of 500 (FCM multicast limit)
    const BATCH_SIZE = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < uniqueTokens.length; i += BATCH_SIZE) {
      const batch = uniqueTokens.slice(i, i + BATCH_SIZE);
      console.log(`[FCM Broadcast] Sending batch ${Math.floor(i/BATCH_SIZE)+1} (${batch.length} tokens)...`);
      try {
        const result = await sendPushNotification(batch, payload);
        totalSuccess += result.successCount || 0;
        totalFailure += result.failureCount || 0;
      } catch (batchError) {
        console.error(`[FCM Broadcast] Batch ${Math.floor(i/BATCH_SIZE)+1} failed:`, batchError.message);
        totalFailure += batch.length;
      }
    }

    console.log(`[FCM Broadcast Users] ✅ Done — Success: ${totalSuccess}, Failed: ${totalFailure}`);
    return {
      totalUsers: users.length,
      totalTokens: uniqueTokens.length,
      successCount: totalSuccess,
      failureCount: totalFailure
    };
  } catch (error) {
    console.error('[FCM Broadcast] ❌ Error in sendBroadcastToAllUsers:', error);
    throw error;
  }
}

/**
 * Send broadcast push notification to ALL vendors
 * Fetches all active vendors with FCM tokens and sends in batches of 500
 * @param {Object} payload - Notification payload (title, body, imageUrl, actionUrl, data)
 * @returns {Promise<Object>} - { totalVendors, totalTokens, successCount, failureCount }
 */
async function sendBroadcastToAllVendors(payload) {
  try {
    const Vendor = require('../models/Vendor');
    console.log('[FCM Broadcast] Fetching all vendors with FCM tokens...');

    const vendors = await Vendor.find({
      isActive: true,
      $or: [
        { fcmTokens: { $exists: true, $not: { $size: 0 } } },
        { fcmTokenMobile: { $exists: true, $not: { $size: 0 } } }
      ]
    }).select('fcmTokens fcmTokenMobile businessName name');

    if (!vendors || vendors.length === 0) {
      console.log('[FCM Broadcast] No vendors with FCM tokens found');
      return { totalVendors: 0, totalTokens: 0, successCount: 0, failureCount: 0 };
    }

    const allTokens = [];
    vendors.forEach(vendor => {
      if (vendor.fcmTokens) allTokens.push(...vendor.fcmTokens);
      if (vendor.fcmTokenMobile) allTokens.push(...vendor.fcmTokenMobile);
    });

    const uniqueTokens = [...new Set(allTokens.filter(t => t && t.trim()))];
    console.log(`[FCM Broadcast] Found ${vendors.length} vendors, ${uniqueTokens.length} unique tokens`);

    const BATCH_SIZE = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < uniqueTokens.length; i += BATCH_SIZE) {
      const batch = uniqueTokens.slice(i, i + BATCH_SIZE);
      try {
        const result = await sendPushNotification(batch, payload);
        totalSuccess += result.successCount || 0;
        totalFailure += result.failureCount || 0;
      } catch (batchError) {
        console.error(`[FCM Broadcast] Batch failed:`, batchError.message);
        totalFailure += batch.length;
      }
    }

    console.log(`[FCM Broadcast Vendors] ✅ Done — Success: ${totalSuccess}, Failed: ${totalFailure}`);
    return {
      totalVendors: vendors.length,
      totalTokens: uniqueTokens.length,
      successCount: totalSuccess,
      failureCount: totalFailure
    };
  } catch (error) {
    console.error('[FCM Broadcast] ❌ Error in sendBroadcastToAllVendors:', error);
    throw error;
  }
}

/**
 * Send broadcast push notification to ALL workers
 * Fetches all active workers with FCM tokens and sends in batches of 500
 * @param {Object} payload - Notification payload (title, body, imageUrl, actionUrl, data)
 * @returns {Promise<Object>} - { totalWorkers, totalTokens, successCount, failureCount }
 */
async function sendBroadcastToAllWorkers(payload) {
  try {
    const mongoose = require('mongoose');
    const Worker = mongoose.model('Worker');
    console.log('[FCM Broadcast] Fetching all workers with FCM tokens...');

    const workers = await Worker.find({
      status: 'active',
      $or: [
        { fcmTokens: { $exists: true, $not: { $size: 0 } } },
        { fcmTokenMobile: { $exists: true, $not: { $size: 0 } } }
      ]
    }).select('fcmTokens fcmTokenMobile name');

    if (!workers || workers.length === 0) {
      console.log('[FCM Broadcast] No workers with FCM tokens found');
      return { totalWorkers: 0, totalTokens: 0, successCount: 0, failureCount: 0 };
    }

    const allTokens = [];
    workers.forEach(w => {
      if (w.fcmTokens) allTokens.push(...w.fcmTokens);
      if (w.fcmTokenMobile) allTokens.push(...w.fcmTokenMobile);
    });

    const uniqueTokens = [...new Set(allTokens.filter(t => t && t.trim()))];
    console.log(`[FCM Broadcast] Found ${workers.length} workers, ${uniqueTokens.length} unique tokens`);

    const BATCH_SIZE = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < uniqueTokens.length; i += BATCH_SIZE) {
      const batch = uniqueTokens.slice(i, i + BATCH_SIZE);
      try {
        const result = await sendPushNotification(batch, payload);
        totalSuccess += result.successCount || 0;
        totalFailure += result.failureCount || 0;
      } catch (batchError) {
        console.error(`[FCM Broadcast] Worker batch failed:`, batchError.message);
        totalFailure += batch.length;
      }
    }

    console.log(`[FCM Broadcast Workers] ✅ Done — Success: ${totalSuccess}, Failed: ${totalFailure}`);
    return {
      totalWorkers: workers.length,
      totalTokens: uniqueTokens.length,
      successCount: totalSuccess,
      failureCount: totalFailure
    };
  } catch (error) {
    console.error('[FCM Broadcast] ❌ Error in sendBroadcastToAllWorkers:', error);
    throw error;
  }
}

module.exports = {
  sendPushNotification,
  sendNotificationToUser,
  sendNotificationToVendor,
  sendNotificationToWorker,
  sendNotificationToAdmin,
  sendBroadcastToAllUsers,
  sendBroadcastToAllVendors,
  sendBroadcastToAllWorkers
};
