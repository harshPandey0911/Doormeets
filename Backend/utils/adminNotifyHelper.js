const Admin = require('../models/Admin');

/**
 * Resolve + notify the admin(s) who should actually see a "needs manual assignment" booking:
 * the Zone Admin(s) assigned to that booking's zone, plus Super Admin(s) (who retain full
 * oversight of every zone). Always also emits a real-time socket event to those same admins'
 * private `admin_<id>` rooms.
 *
 * Replaces a pattern that was duplicated across 4 call sites and had two bugs at once:
 *   1. `User.find({ role: 'ADMIN' })` queried the wrong collection — real admins live in the
 *      separate `Admin` model — so it always matched 0 documents and no DB notification was
 *      EVER actually persisted for anyone, regardless of zone.
 *   2. `io.to('all_admins').emit(...)` broadcasts to every connected admin socket unconditionally,
 *      with no zone filtering at all — so whichever admin happened to be online (often Super
 *      Admin) saw it, while the specific Zone Admin responsible for that zone (offline, or simply
 *      not filtered for) never got a persisted notification to find it later.
 *
 * @param {Object} booking - Booking document (needs ._id, .bookingNumber, .zoneId)
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.type='admin_booking_requested']
 * @param {string} [opts.priority='high']
 * @param {string} [opts.link] - defaults to the admin booking detail page
 */
const notifyBookingAdmins = async (booking, { title, message, type = 'admin_booking_requested', priority = 'high', link } = {}) => {
  try {
    const { createNotification } = require('../controllers/notificationControllers/notificationController');
    const { getIO } = require('../sockets');

    // 1. Zone Admin(s) actually responsible for this booking's zone.
    const zoneAdmins = booking.zoneId
      ? await Admin.find({
          isActive: true,
          $or: [{ zoneId: booking.zoneId }, { assignedZones: booking.zoneId }]
        }).select('_id')
      : [];

    // 2. Super Admin(s) — always kept in the loop for oversight, on top of whichever zone
    // admin(s) matched above (deduped below).
    const superAdmins = await Admin.find({
      isActive: true,
      role: { $in: ['SUPER_ADMIN', 'super_admin'] }
    }).select('_id');

    const recipientIds = new Map();
    [...zoneAdmins, ...superAdmins].forEach(a => recipientIds.set(a._id.toString(), a._id));

    if (recipientIds.size === 0) {
      console.warn(`[AdminNotify] No admin (zone or super) found to notify for booking ${booking.bookingNumber} (zoneId=${booking.zoneId || 'none'})`);
      return;
    }

    const notificationData = {
      userId: null,
      vendorId: null,
      workerId: null,
      type,
      title,
      message,
      priority,
      relatedId: booking._id,
      relatedType: 'booking',
      pushData: {
        type,
        bookingId: booking._id.toString(),
        link: link || `/admin/bookings/${booking._id}`
      }
    };

    await Promise.all(
      Array.from(recipientIds.values()).map(adminId =>
        createNotification({ ...notificationData, adminId }).catch(err =>
          console.error(`[AdminNotify] Failed to notify admin ${adminId}:`, err)
        )
      )
    );

    // Real-time push to each recipient's own room — createNotification already emits to
    // `admin_<id>` internally, but also emit the raw event here for any listener still keyed on
    // 'admin_booking_requested' directly rather than the generic 'notification' event.
    const io = getIO();
    if (io) {
      recipientIds.forEach(adminId => {
        io.to(`admin_${adminId.toString()}`).emit(type, {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          message
        });
      });
    }
  } catch (err) {
    console.error('[AdminNotify] notifyBookingAdmins failed:', err);
  }
};

module.exports = { notifyBookingAdmins };
