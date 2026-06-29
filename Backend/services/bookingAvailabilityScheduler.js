const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');

function parseScheduledStartTime(scheduledDate, timeStr) {
  const date = new Date(scheduledDate);
  if (isNaN(date.getTime())) return new Date();
  
  let hours = 0;
  let minutes = 0;
  if (typeof timeStr === 'string') {
    const cleanTime = timeStr.trim().toUpperCase();
    const isPM = cleanTime.includes('PM');
    const isAM = cleanTime.includes('AM');
    let numericTime = cleanTime.replace(/[AP]M/, '').trim();
    const parts = numericTime.split(':');
    if (parts.length >= 1) {
      hours = parseInt(parts[0], 10) || 0;
    }
    if (parts.length >= 2) {
      minutes = parseInt(parts[1], 10) || 0;
    }
    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
  }
  date.setHours(hours, minutes, 0, 0);
  return date;
}

class BookingAvailabilityScheduler {
  constructor(io) {
    this.io = io;
    this.intervalId = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('[BookingAvailabilityScheduler] Already running.');
      return;
    }
    this.isRunning = true;
    console.log('[BookingAvailabilityScheduler] Started — running every 60s');
    
    this.intervalId = setInterval(async () => {
      await this.runTasks();
    }, 60000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('[BookingAvailabilityScheduler] Stopped.');
    }
  }

  async runTasks() {
    try {
      await this.processAutoReservations();
      await this.processUpcomingReconfirmations();
      await this.processReconfirmationTimeouts();
      await this.processVendorTimeReminders();
    } catch (error) {
      console.error('[BookingAvailabilityScheduler] Error in runTasks:', error);
    }
  }

  /**
   * Task 1: Auto-Reservation Transitions
   * Finds all vendors whose reservedFrom time has reached and marks them as RESERVED.
   */
  async processAutoReservations() {
    try {
      const now = new Date();
      const vendorsToReserve = await Vendor.find({
        reservedFrom: { $ne: null, $lte: now },
        availabilityStatus: 'ONLINE'
      });

      for (const vendor of vendorsToReserve) {
        vendor.availabilityStatus = 'RESERVED';
        vendor.availability = 'ON_JOB';
        vendor.workStatus = 'busy';
        await vendor.save();
        console.log(`[BookingAvailabilityScheduler] Vendor ${vendor.name} (${vendor._id}) is now RESERVED for upcoming booking ${vendor.reservedBookingId}`);
      }
    } catch (err) {
      console.error('[BookingAvailabilityScheduler] Error in processAutoReservations:', err);
    }
  }

  /**
   * Task 2: Send Reconfirmations (30 minutes before slot start)
   */
  async processUpcomingReconfirmations() {
    try {
      const now = Date.now();
      const bookings = await Booking.find({
        status: { $in: ['accepted', 'confirmed', 'assigned'] },
        bookingType: 'scheduled',
        reconfirmationStatus: null,
        vendorId: { $ne: null }
      }).populate('userId', 'name');

      for (const booking of bookings) {
        const slotStart = parseScheduledStartTime(booking.scheduledDate, booking.timeSlot?.start || booking.scheduledTime);
        const reconfirmTriggerTime = slotStart.getTime() - 30 * 60 * 1000;

        if (now >= reconfirmTriggerTime) {
          booking.reconfirmationStatus = 'PENDING';
          booking.reconfirmationSentAt = new Date();
          booking.reconfirmationRequired = true;
          await booking.save();

          // Emit real-time Socket event to vendor
          if (this.io) {
            this.io.to(`vendor_${booking.vendorId.toString()}`).emit('upcoming_reconfirmation_request', {
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              customerName: booking.userId?.name || 'Customer',
              scheduledTime: booking.scheduledTime || `${booking.timeSlot?.start} - ${booking.timeSlot?.end}`,
              serviceName: booking.serviceName,
              address: booking.address,
              timeoutMs: 10 * 60 * 1000
            });

            // Also emit real-time Socket event to worker if assigned
            if (booking.workerId) {
              this.io.to(`worker_${booking.workerId.toString()}`).emit('upcoming_reconfirmation_request', {
                bookingId: booking._id,
                bookingNumber: booking.bookingNumber,
                customerName: booking.userId?.name || 'Customer',
                scheduledTime: booking.scheduledTime || `${booking.timeSlot?.start} - ${booking.timeSlot?.end}`,
                serviceName: booking.serviceName,
                address: booking.address,
                timeoutMs: 10 * 60 * 1000
              });
            }
          }

          // Create DB notification and push alert for vendor
          const { createNotification } = require('../controllers/notificationControllers/notificationController');
          await createNotification({
            vendorId: booking.vendorId,
            type: 'booking_reconfirmation_request',
            title: 'Confirm Upcoming Booking',
            message: `Please confirm you are ready for scheduled booking ${booking.bookingNumber} at ${booking.scheduledTime || booking.timeSlot?.start}`,
            relatedId: booking._id,
            relatedType: 'booking',
            pushData: {
              type: 'booking_reconfirmation_request',
              bookingId: booking._id.toString(),
              link: `/vendor/bookings/${booking._id}`
            }
          });

          // Create DB notification and push alert for worker if assigned
          if (booking.workerId) {
            await createNotification({
              workerId: booking.workerId,
              type: 'booking_reconfirmation_request',
              title: 'Confirm Upcoming Booking',
              message: `Please confirm you are ready for scheduled booking ${booking.bookingNumber} at ${booking.scheduledTime || booking.timeSlot?.start}`,
              relatedId: booking._id,
              relatedType: 'booking',
              pushData: {
                type: 'booking_reconfirmation_request',
                bookingId: booking._id.toString(),
                link: `/worker/bookings/${booking._id}`
              }
            });
          }

          console.log(`[BookingAvailabilityScheduler] Reconfirmation request sent to Vendor ${booking.vendorId} for booking ${booking.bookingNumber}`);
        }
      }
    } catch (err) {
      console.error('[BookingAvailabilityScheduler] Error in processUpcomingReconfirmations:', err);
    }
  }

  /**
   * Task 3: Reconfirmation Timeouts (10 minutes after request is sent)
   */
  async processReconfirmationTimeouts() {
    try {
      const timeoutThreshold = new Date(Date.now() - 10 * 60 * 1000);
      const missedBookings = await Booking.find({
        reconfirmationStatus: 'PENDING',
        reconfirmationSentAt: { $lte: timeoutThreshold }
      }).populate('vendorId', 'name businessName');

      for (const booking of missedBookings) {
        booking.reconfirmationStatus = 'MISSED';
        booking.bookingRiskStatus = 'HIGH';
        await booking.save();

        const vendorName = booking.vendorId?.businessName || booking.vendorId?.name || 'Vendor';
        const city = booking.address?.city || '';
        const message = `Vendor ${vendorName} has not reconfirmed scheduled booking #${booking.bookingNumber}. Slot: ${booking.scheduledTime || `${booking.timeSlot?.start} - ${booking.timeSlot?.end}`}. Customer may be impacted.`;

        // Retrieve Admin accounts
        const Admin = require('../models/Admin');
        const City = require('../models/City');

        const cityDoc = await City.findOne({ name: new RegExp(`^${city}$`, 'i') });
        let adminQuery = { role: 'admin' };
        if (cityDoc) {
          adminQuery = {
            $or: [
              { role: 'admin' },
              { role: 'CITY_ADMIN', assignedCities: cityDoc._id }
            ]
          };
        }

        const admins = await Admin.find(adminQuery);
        const { createNotification } = require('../controllers/notificationControllers/notificationController');

        for (const admin of admins) {
          // DB Alert
          await createNotification({
            adminId: admin._id,
            type: 'booking_escalation',
            title: 'Reconfirmation Missed (High Risk)',
            message,
            relatedId: booking._id,
            relatedType: 'booking',
            pushData: {
              type: 'booking_escalation',
              bookingId: booking._id.toString(),
              link: `/admin/bookings/${booking._id}`
            }
          });

          // Real-time socket event
          if (this.io) {
            this.io.to(`admin_${admin._id.toString()}`).emit('booking_escalation', {
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              message,
              severity: 'HIGH'
            });
          }
        }

        console.log(`[BookingAvailabilityScheduler] Escalated missed booking ${booking.bookingNumber} to ${admins.length} admins`);
      }
    } catch (err) {
      console.error('[BookingAvailabilityScheduler] Error in processReconfirmationTimeouts:', err);
    }
  }

  /**
   * Task 4: Hourly & Half-hourly Vendor Job Reminders
   * Sends notifications 1 hour and 30 minutes before booking start time.
   */
  async processVendorTimeReminders() {
    try {
      const now = Date.now();
      const bookings = await Booking.find({
        status: { $in: ['accepted', 'confirmed', 'assigned'] },
        bookingType: 'scheduled',
        vendorId: { $ne: null },
        $or: [
          { sentOneHourReminder: { $ne: true } },
          { sentHalfHourReminder: { $ne: true } }
        ]
      });

      const { createNotification } = require('../controllers/notificationControllers/notificationController');

      for (const booking of bookings) {
        const slotStart = parseScheduledStartTime(booking.scheduledDate, booking.timeSlot?.start || booking.scheduledTime);
        const slotStartMs = slotStart.getTime();

        // 1. One Hour Reminder (Trigger if time left is <= 60 minutes and > 30 minutes)
        if (!booking.sentOneHourReminder) {
          const timeLeftMs = slotStartMs - now;
          if (timeLeftMs <= 60 * 60 * 1000 && timeLeftMs > 0) {
            booking.sentOneHourReminder = true;
            await booking.save();

            const hasAssigned = !!booking.workerId;
            const title = 'Upcoming Booking Reminder';
            const message = hasAssigned
              ? `Reminder: Your booking ${booking.bookingNumber} starts in 1 hour (${booking.scheduledTime || booking.timeSlot?.start}).`
              : `Important Reminder: You have an upcoming booking ${booking.bookingNumber} at ${booking.scheduledTime || booking.timeSlot?.start} in 1 hour. Please assign a worker now!`;

            await createNotification({
              vendorId: booking.vendorId,
              type: 'booking_reminder',
              title,
              message,
              relatedId: booking._id,
              relatedType: 'booking',
              pushData: {
                type: 'booking_reminder',
                bookingId: booking._id.toString(),
                link: `/vendor/bookings/${booking._id}`
              }
            });

            if (this.io) {
              this.io.to(`vendor_${booking.vendorId.toString()}`).emit('booking_reminder', {
                bookingId: booking._id,
                bookingNumber: booking.bookingNumber,
                title,
                message
              });
            }
            console.log(`[BookingAvailabilityScheduler] Sent 1-hour reminder to Vendor ${booking.vendorId} for booking ${booking.bookingNumber}`);
          }
        }

        // 2. 30 Minutes Reminder (Trigger if time left is <= 30 minutes)
        if (!booking.sentHalfHourReminder) {
          const timeLeftMs = slotStartMs - now;
          if (timeLeftMs <= 30 * 60 * 1000 && timeLeftMs > 0) {
            booking.sentHalfHourReminder = true;
            await booking.save();

            const hasAssigned = !!booking.workerId;
            const title = 'Upcoming Booking Reminder (30 mins)';
            const message = hasAssigned
              ? `Reminder: Your booking ${booking.bookingNumber} starts in 30 minutes (${booking.scheduledTime || booking.timeSlot?.start}).`
              : `Urgent: Your booking ${booking.bookingNumber} starts in 30 minutes (${booking.scheduledTime || booking.timeSlot?.start}). Please assign a worker immediately!`;

            await createNotification({
              vendorId: booking.vendorId,
              type: 'booking_reminder',
              title,
              message,
              relatedId: booking._id,
              relatedType: 'booking',
              pushData: {
                type: 'booking_reminder',
                bookingId: booking._id.toString(),
                link: `/vendor/bookings/${booking._id}`
              }
            });

            if (this.io) {
              this.io.to(`vendor_${booking.vendorId.toString()}`).emit('booking_reminder', {
                bookingId: booking._id,
                bookingNumber: booking.bookingNumber,
                title,
                message
              });
            }
            console.log(`[BookingAvailabilityScheduler] Sent 30-min reminder to Vendor ${booking.vendorId} for booking ${booking.bookingNumber}`);
          }
        }
      }
    } catch (err) {
      console.error('[BookingAvailabilityScheduler] Error in processVendorTimeReminders:', err);
    }
  }
}

let schedulerInstance = null;

const initializeAvailabilityScheduler = (io) => {
  if (!schedulerInstance) {
    schedulerInstance = new BookingAvailabilityScheduler(io);
    schedulerInstance.start();
  }
  return schedulerInstance;
};

const getAvailabilityScheduler = () => schedulerInstance;

module.exports = {
  BookingAvailabilityScheduler,
  initializeAvailabilityScheduler,
  getAvailabilityScheduler
};
