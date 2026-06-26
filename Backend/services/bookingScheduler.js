/**
 * Booking Scheduler Service — Optimized
 * Handles Wave-Based Vendor Alerting
 *
 * Wave Logic:
 * - Wave 1: First 3 closest vendors (alerted immediately on booking creation)
 * - Wave 2: Next 3 vendors (after 15s if no accept)
 * - Wave 3: Next 4 vendors (after another 15s)
 * - Wave 4+: All remaining vendors
 *
 * OPTIMIZATIONS:
 * - All active bookings processed in PARALLEL (Promise.all, not serial for-loop)
 * - Circuit breaker: if no searching bookings exist, extend check interval to 30s
 * - Single Vendor.find per wave instead of per booking
 */

const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const { BOOKING_STATUS } = require('../utils/constants');
const { createNotification } = require('../controllers/notificationControllers/notificationController');

const Settings = require('../models/Settings');

// Wave configuration - More sequential (1 by 1 for first few vendors)
let WAVE_CONFIG = {
  1: { count: 1, duration: 60000 }, // Closest vendor (1 min)
  2: { count: 1, duration: 60000 }, // 2nd closest (1 min)
  3: { count: 1, duration: 60000 }, // 3rd closest (1 min)
  4: { count: 2, duration: 60000 }, // Next 2 (1 min)
  5: { count: Infinity, duration: 0 } // Everyone else
};

let MAX_SEARCH_TIME_MS = 5 * 60 * 1000; // 5 mins fallback

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
          const waveDur = (globalSettings.waveDuration || 60) * 1000;
          WAVE_CONFIG = {
            1: { count: 1, duration: waveDur },
            2: { count: 1, duration: waveDur },
            3: { count: 1, duration: waveDur },
            4: { count: 2, duration: waveDur },
            5: { count: Infinity, duration: 0 }
          };
          MAX_SEARCH_TIME_MS = (globalSettings.maxSearchTime || 10) * 60 * 1000;
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
            const waveConfig = WAVE_CONFIG[currentWave] || WAVE_CONFIG[4];
            const startTime = new Date(booking.createdAt || booking.waveStartedAt).getTime();
            const totalElapsed = now - startTime;

            // --- PERSISTENCE: Save expiresAt to DB if missing ---
            if (!booking.expiresAt) {
              const expiresAtDate = new Date(startTime + MAX_SEARCH_TIME_MS);
              await Booking.findByIdAndUpdate(booking._id, { $set: { expiresAt: expiresAtDate } });
            }

            // --- EXPIRY CHECK ---
            if (totalElapsed > MAX_SEARCH_TIME_MS) {
              // Try atomic update to NO_VENDORS
              const updateResult = await Booking.updateOne(
                { _id: booking._id, status: BOOKING_STATUS.SEARCHING },
                {
                  $set: {
                    status: BOOKING_STATUS.NO_VENDORS,
                    cancellationReason: 'No vendor accepted within time limit'
                  }
                }
              );

              if (updateResult.modifiedCount > 0) {
                console.log(`[BookingScheduler] ${booking.bookingNumber}: Search timed out. Status updated to NO_VENDORS.`);
                
                // Refund Loyalty Points if any were redeemed
                if (booking.loyaltyPointsRedeemed > 0) {
                  try {
                    const User = require('../models/User');
                    const Transaction = require('../models/Transaction');
                    await User.findByIdAndUpdate(booking.userId, { $inc: { loyaltyPoints: booking.loyaltyPointsRedeemed } });
                    
                    await Transaction.create({
                      userId: booking.userId,
                      type: 'refund',
                      amount: booking.loyaltyPointsRedeemed,
                      status: 'completed',
                      paymentMethod: 'system',
                      description: `Refunded ${booking.loyaltyPointsRedeemed} Loyalty Points for booking #${booking.bookingNumber} (search timeout)`,
                      bookingId: booking._id,
                      metadata: { type: 'loyalty_points', pointsRefunded: booking.loyaltyPointsRedeemed }
                    });
                    
                    await Booking.updateOne({ _id: booking._id }, { $set: { loyaltyPointsRefunded: true } });
                    console.log(`[BookingScheduler] Refunded ${booking.loyaltyPointsRedeemed} points to user ${booking.userId}`);
                  } catch (refErr) {
                    console.error('[BookingScheduler] Error refunding loyalty points on timeout:', refErr);
                  }
                }

                // Notify User
                if (this.io) {
                  this.io.to(`user_${booking.userId}`).emit('booking_search_failed', {
                    bookingId: booking._id,
                    message: 'No vendors available at the moment. Please try again later.'
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

            const waveElapsed = now - new Date(booking.waveStartedAt).getTime();
            // Only process if this booking's wave timer has expired
            if (waveConfig.duration === 0 || waveElapsed < waveConfig.duration) return;

            const nextWave = currentWave + 1;

            // Get all vendors for the NEXT wave
            let vendorsToNotify = booking.potentialVendors.filter(v => v.wave === nextWave);

            if (vendorsToNotify.length === 0 && nextWave <= 3) {
              // If there are no vendors in this wave, advance silently to the next wave immediately
              // We'll update DB and let the next polling cycle pick it up, or we can just update currentWave
              console.log(`[BookingScheduler] Booking ${booking.bookingNumber}: No vendors in Wave ${nextWave}, skipping...`);
              await Booking.findByIdAndUpdate(booking._id, {
                $set: { currentWave: nextWave, waveStartedAt: new Date(now - waveConfig.duration) } // Subtract duration so next cycle triggers immediately
              });
              return;
            } else if (vendorsToNotify.length === 0) {
               // Next wave > 3 and no more vendors
               console.log(`[BookingScheduler] Booking ${booking.bookingNumber}: Exhausted all waves.`);
               return;
            }

            // Filter to only online+available vendors (single batch find for this booking)
            const vendorIds = vendorsToNotify.map(v => v.vendorId);
            const onlineVendors = await Vendor.find(
              { _id: { $in: vendorIds }, isOnline: true, availability: { $in: ['AVAILABLE', 'BUSY'] } },
              '_id'
            ).lean();

            const onlineSet = new Set(onlineVendors.map(v => v._id.toString()));
            vendorsToNotify = vendorsToNotify.filter(v => onlineSet.has(v.vendorId.toString()));

            // Advance wave in DB — use findByIdAndUpdate for atomicity (avoids race with accept)
            const notifyIds = vendorsToNotify.map(v => v.vendorId);
            await Booking.findByIdAndUpdate(booking._id, {
              $set: { currentWave: nextWave, waveStartedAt: new Date() },
              $addToSet: { notifiedVendors: { $each: notifyIds } }
            });

            if (vendorsToNotify.length === 0) {
              console.log(`[BookingScheduler] Booking ${booking.bookingNumber}: Wave ${nextWave} all offline, advancing quietly`);
              return;
            }

            console.log(`[BookingScheduler] ${booking.bookingNumber}: Wave ${nextWave} → notifying ${vendorsToNotify.length} vendors`);

            // Insert BookingRequest records + send notifications (both in parallel)
            const bookingRequests = vendorsToNotify.map(v => ({
              bookingId: booking._id,
              vendorId: v.vendorId,
              status: 'PENDING',
              createdAt: booking.createdAt || new Date(),
              distance: v.distance || null,
              sentAt: new Date(),
              expiresAt: new Date(Date.now() + 60 * 60 * 1000)
            }));

            await Promise.all([
              BookingRequest.insertMany(bookingRequests, { ordered: false }).catch(err => {
                if (err.code !== 11000) console.error('[BookingScheduler] BookingRequest insert error:', err);
              }),
              this.notifyVendors(booking, vendorsToNotify)
            ]);

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
              categoryIcon: populatedBooking.categoryIcon,
              createdAt: populatedBooking.createdAt,
              expiresAt: new Date(new Date(populatedBooking.createdAt).getTime() + MAX_SEARCH_TIME_MS).toISOString(),
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
