/**
 * Booking Scheduler Service — Single Wave (All Vendors at Once)
 *
 * Wave Logic (Simplified):
 * - Wave 1: ALL vendors within radius are notified SIMULTANEOUSLY on booking creation
 * - 60 seconds later: if no vendor accepts → route to admin
 *
 * OPTIMIZATIONS:
 * - All active bookings processed in PARALLEL (Promise.all)
 * - Circuit breaker: if no searching bookings exist, extend check interval to 30s
 */

const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const { BOOKING_STATUS } = require('../utils/constants');
const { createNotification } = require('../controllers/notificationControllers/notificationController');

const Settings = require('../models/Settings');

// SINGLE WAVE CONFIG: All vendors get notified simultaneously.
// After 1 wave duration (60s), if no accept → route to admin.
let WAVE_CONFIG = {
  1: { count: Infinity, duration: 60000 }, // All vendors, 1 minute
};

let MAX_SEARCH_TIME_MS = 1 * 60 * 1000; // 1 minute — after this, go to admin

const ACTIVE_INTERVAL_MS = 5000;  // Poll every 5s when bookings exist
const IDLE_INTERVAL_MS = 30000;   // Poll every 30s when no active bookings (circuit breaker)

// Helper not needed anymore for count-based logic
// We use booking.potentialVendors.filter(v => v.wave === currentWave)

class BookingScheduler {
  constructor(io) {
    this.io = io;
    this.intervalId = null;
    this.isRunning = false;
    this.isIdle = false; // Circuit breaker state
  }

  start() {
    if (this.isRunning) {
      console.log('[BookingScheduler] Already running.');
      return;
    }
    this.isRunning = true;
    console.log('[BookingScheduler] Started — active interval: 5s, idle interval: 30s');
    this.scheduleNext(ACTIVE_INTERVAL_MS);
  }

  scheduleNext(intervalMs) {
    if (this.intervalId) clearTimeout(this.intervalId);
    this.intervalId = setTimeout(async () => {
      const hadWork = await this.processWaves();
      // Adaptive interval: if idle, slow down; if active, stay fast
      this.scheduleNext(hadWork ? ACTIVE_INTERVAL_MS : IDLE_INTERVAL_MS);
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('[BookingScheduler] Stopped.');
    }
  }

  /**
   * Process all active searching bookings in PARALLEL.
   * @returns {boolean} true if any booking was processed, false if idle
   */
  async processWaves() {
    try {
      const BookingRequest = require('../models/BookingRequest');

      // --- REFRESH SETTINGS ---
      try {
        const globalSettings = await Settings.findOne({ type: 'global' }).lean();
        if (globalSettings) {
          // Always use single-wave (all vendors at once) for 1 minute
          const waveDur = (globalSettings.waveDuration || 60) * 1000;
          WAVE_CONFIG = {
            1: { count: Infinity, duration: waveDur }, // ALL vendors, single wave
          };
          MAX_SEARCH_TIME_MS = waveDur; // Search = 1 wave duration = 1 minute
        }
      } catch (sErr) {
        console.error('[BookingScheduler] Settings fetch error:', sErr);
      }

      // --- CIRCUIT BREAKER: Fast query to detect if any work is needed ---
      const activeBookings = await Booking.find(
        {
          status: BOOKING_STATUS.SEARCHING,
          waveStartedAt: { $ne: null },
          potentialVendors: { $exists: true, $not: { $size: 0 } }
        },
        '_id currentWave waveStartedAt potentialVendors notifiedVendors bookingNumber createdAt userId expiresAt loyaltyPointsRedeemed' // Added createdAt, userId, expiresAt, loyaltyPointsRedeemed
      ).lean();

      if (activeBookings.length === 0) {
        return false; // Idle — caller will use longer interval
      }

      const now = Date.now();

      // --- PARALLEL PROCESSING: All ready bookings processed simultaneously ---
      await Promise.all(
        activeBookings.map(async (booking) => {
          try {
            const currentWave = booking.currentWave || 1;
            const waveConfig = WAVE_CONFIG[currentWave] || WAVE_CONFIG[1]; // Only wave 1 exists now
            const startTime = new Date(booking.createdAt || booking.waveStartedAt).getTime();
            const totalElapsed = now - startTime;

            // --- PERSISTENCE: Save expiresAt to DB if missing ---
            if (!booking.expiresAt) {
              const expiresAtDate = new Date(startTime + MAX_SEARCH_TIME_MS);
              await Booking.findByIdAndUpdate(booking._id, { $set: { expiresAt: expiresAtDate } });
            }

            // --- EXPIRY CHECK ---
            if (totalElapsed > MAX_SEARCH_TIME_MS) {
              // Try atomic update to pending_admin
              const updateResult = await Booking.updateOne(
                { _id: booking._id, status: BOOKING_STATUS.SEARCHING },
                {
                  $set: {
                    status: 'pending_admin',
                    cancellationReason: 'No vendor accepted within time limit. Awaiting admin review.'
                  }
                }
              );

              if (updateResult.modifiedCount > 0) {
                console.log(`[BookingScheduler] ${booking.bookingNumber}: Search timed out. Routed to admin.`);

                // Save notification in database for all admins
                try {
                  const User = require('../models/User');
                  const admins = await User.find({ role: 'ADMIN' });
                  
                  const notificationData = {
                    userId: null,
                    vendorId: null,
                    workerId: null,
                    type: 'admin_booking_requested',
                    title: 'Manual Assignment Needed',
                    message: `Booking #${booking.bookingNumber} search timed out. Manual assignment needed.`,
                    priority: 'high',
                    pushData: {
                      type: 'admin_booking_requested',
                      bookingId: booking._id.toString(),
                      link: `/admin/bookings/${booking._id}`
                    }
                  };
                  
                  await Promise.all(
                    admins.map(admin =>
                      createNotification({ ...notificationData, adminId: admin._id })
                    )
                  );
                } catch (dbNotifErr) {
                  console.error('[BookingScheduler] Failed to save admin timeout notification:', dbNotifErr);
                }

                // Notify User and Admin
                if (this.io) {
                  this.io.to('all_admins').emit('admin_booking_requested', {
                    bookingId: booking._id.toString(),
                    bookingNumber: booking.bookingNumber,
                    status: 'pending_admin',
                    message: 'Booking request sent to admin for manual assignment.'
                  });
                  this.io.to(`user_${booking.userId}`).emit('booking_updated', {
                    bookingId: booking._id,
                    status: 'pending_admin',
                    message: 'Booking request sent to admin for manual assignment.'
                  });
                }

                // Remove from all notified vendors
                if (booking.notifiedVendors && booking.notifiedVendors.length > 0) {
                  booking.notifiedVendors.forEach(vId => {
                    this.io.to(`vendor_${vId}`).emit('removeVendorBooking', { id: booking._id });
                  });
                }
              }
              return;
            }

            // After single wave expires → route to admin immediately
            // (No more waves, all vendors already notified)
            const activeRequestsCount = await BookingRequest.countDocuments({
              bookingId: booking._id,
              status: { $in: ['PENDING', 'VIEWED'] }
            });

            // Only escalate if no active pending requests
            if (activeRequestsCount === 0) {
              console.log(`[BookingScheduler] Booking ${booking.bookingNumber}: Wave expired with no acceptance. Routing to admin.`);
              const updateResult = await Booking.updateOne(
                { _id: booking._id, status: BOOKING_STATUS.SEARCHING },
                {
                  $set: {
                    status: 'pending_admin',
                    cancellationReason: 'No vendor accepted within time limit. Awaiting admin review.'
                  }
                }
              );

              if (updateResult.modifiedCount > 0) {
                // Save notification for all admins
                try {
                  const User = require('../models/User');
                  const admins = await User.find({ role: 'ADMIN' });
                  const notificationData = {
                    userId: null, vendorId: null, workerId: null,
                    type: 'admin_booking_requested',
                    title: 'Manual Assignment Needed',
                    message: `Booking #${booking.bookingNumber} search timed out. Manual assignment needed.`,
                    priority: 'high',
                    pushData: { type: 'admin_booking_requested', bookingId: booking._id.toString(), link: `/admin/bookings/${booking._id}` }
                  };
                  await Promise.all(admins.map(admin => createNotification({ ...notificationData, adminId: admin._id })));
                } catch (dbNotifErr) {
                  console.error('[BookingScheduler] Failed to save admin notification:', dbNotifErr);
                }

                // Socket: notify admin + user
                if (this.io) {
                  this.io.to('all_admins').emit('admin_booking_requested', {
                    bookingId: booking._id.toString(),
                    bookingNumber: booking.bookingNumber,
                    status: 'pending_admin',
                    message: 'Booking request sent to admin for manual assignment.',
                    playSound: true
                  });
                  this.io.to(`user_${booking.userId}`).emit('booking_updated', {
                    bookingId: booking._id,
                    status: 'pending_admin',
                    message: 'Booking request sent to admin for manual assignment.'
                  });
                  // Remove from all notified vendors
                  if (booking.notifiedVendors?.length > 0) {
                    booking.notifiedVendors.forEach(vId => {
                      this.io.to(`vendor_${vId}`).emit('removeVendorBooking', { id: booking._id });
                    });
                  }
                }
              }
            }
            return;
          } catch (bookingErr) {
            console.error(`[BookingScheduler] Error processing booking ${booking._id}:`, bookingErr);
          }
        })
      );

      return true; // Had work to do
    } catch (error) {
      console.error('[BookingScheduler] Error processing waves:', error);
      return false;
    }
  }

  async notifyVendors(booking, vendors) {
    try {
      // Fetch booking details for notification (single query for the whole wave)
      const populatedBooking = await Booking.findById(booking._id)
        .populate('serviceId', 'title')
        .populate('userId', 'name phone')
        .lean();

      if (!populatedBooking) return;

      const serviceName = populatedBooking.serviceId?.title || populatedBooking.serviceName;
      const customerName = populatedBooking.userId?.name || 'Customer';

      // Send all vendor notifications in parallel
      await Promise.all(
        vendors.map(async (v) => {
          // Fire socket immediately (synchronous, non-blocking)
          if (this.io) {
            this.io.to(`vendor_${v.vendorId}`).emit('new_booking_request', {
              bookingId: booking._id,
              serviceName,
              customerName,
              scheduledDate: populatedBooking.scheduledDate,
              scheduledTime: populatedBooking.scheduledTime,
              price: populatedBooking.finalAmount,
              address: populatedBooking.address,
              distance: v.distance,
              serviceCategory: populatedBooking.serviceCategory,
              brandName: populatedBooking.brandName,
              brandIcon: populatedBooking.brandIcon,
              expiresAt: new Date(Date.now() + (WAVE_CONFIG[booking.currentWave]?.duration || 60000)).toISOString(),
              status: populatedBooking.status,
              serviceType: populatedBooking.serviceType || 'service',
              playSound: true,
              message: `New booking request within ${v.distance?.toFixed(1) || '?'}km!`
            });
          }

          // Create DB notification + FCM push
          await createNotification({
            vendorId: v.vendorId,
            type: 'booking_request',
            title: 'New Booking Request',
            message: `New service request for ${serviceName} from ${customerName}`,
            relatedId: booking._id,
            relatedType: 'booking',
            data: {
              bookingId: booking._id,
              serviceName,
              customerName,
              scheduledDate: populatedBooking.scheduledDate,
              scheduledTime: populatedBooking.scheduledTime,
              location: populatedBooking.address,
              price: populatedBooking.finalAmount,
              distance: v.distance
            },
            pushData: {
              type: 'new_booking',
              dataOnly: false,
              link: `/vendor/bookings/${booking._id}`
            }
          });
        })
      );

      console.log(`[BookingScheduler] Notified ${vendors.length} vendors for booking ${booking.bookingNumber}`);
    } catch (error) {
      console.error('[BookingScheduler] Error notifying vendors:', error);
    }
  }
}

// Singleton instance
let schedulerInstance = null;

const initializeScheduler = (io) => {
  if (!schedulerInstance) {
    schedulerInstance = new BookingScheduler(io);
    schedulerInstance.start();
  }
  return schedulerInstance;
};

const getScheduler = () => schedulerInstance;

module.exports = { BookingScheduler, initializeScheduler, getScheduler };
