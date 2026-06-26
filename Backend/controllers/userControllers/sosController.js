const SOSAlert = require('../../models/SOSAlert');
const User = require('../../models/User');
const { getIO } = require('../../sockets');

// User triggers SOS emergency
exports.triggerSOS = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = req.body;

    const user = await User.findById(userId).select('name phone email');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const alert = await SOSAlert.create({
      userId,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      status: 'pending'
    });

    // Send real-time notification to all connected Admin panel sockets
    try {
      const io = getIO();
      if (io) {
        io.emit('sos_alert_triggered', {
          alertId: alert._id,
          userId: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          lat: alert.lat,
          lng: alert.lng,
          createdAt: alert.createdAt
        });
        console.log(`[SOS] Broadcasted socket event for SOS Alert: ${alert._id}`);
      }
    } catch (sockErr) {
      console.error('[SOS] Socket broadcast failed:', sockErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'SOS Emergency Alert triggered successfully. Help is on the way.',
      alert
    });
  } catch (error) {
    console.error('Error triggering SOS:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to trigger SOS alert'
    });
  }
};

// Admin gets all SOS logs
exports.getSOSLogs = async (req, res) => {
  try {
    const alerts = await SOSAlert.find()
      .populate('userId', 'name phone email')
      .populate('vendorId', 'name businessName phone email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('Error fetching SOS logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch SOS logs'
    });
  }
};

// Admin resolves an SOS alert
exports.resolveSOS = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const alert = await SOSAlert.findById(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'SOS Alert not found'
      });
    }

    alert.status = 'resolved';
    alert.notes = notes || 'Resolved by Administrator';
    alert.resolvedAt = new Date();
    await alert.save();

    // Broadcast alert resolution to socket
    try {
      const io = getIO();
      if (io) {
        io.emit('sos_alert_resolved', {
          alertId: alert._id,
          userId: alert.userId,
          vendorId: alert.vendorId,
          status: 'resolved',
          notes: alert.notes
        });
        console.log(`[SOS] Broadcasted resolution socket event for alert: ${alert._id}`);
      }
    } catch (sockErr) {
      console.error('[SOS] Socket resolution broadcast failed:', sockErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'SOS alert resolved successfully',
      alert
    });
  } catch (error) {
    console.error('Error resolving SOS:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve SOS alert'
    });
  }
};

// Vendor triggers SOS emergency
exports.triggerVendorSOS = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { lat, lng } = req.body;
    const Vendor = require('../../models/Vendor');

    const vendor = await Vendor.findById(vendorId).select('name businessName phone email');
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const alert = await SOSAlert.create({
      vendorId,
      userType: 'vendor',
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      status: 'pending'
    });

    // Send real-time notification to all connected Admin panel sockets
    try {
      const io = getIO();
      if (io) {
        io.emit('sos_alert_triggered', {
          alertId: alert._id,
          vendorId: vendor._id,
          name: vendor.businessName || vendor.name,
          phone: vendor.phone,
          email: vendor.email,
          lat: alert.lat,
          lng: alert.lng,
          userType: 'vendor',
          createdAt: alert.createdAt
        });
        console.log(`[SOS] Broadcasted socket event for Vendor SOS Alert: ${alert._id}`);
      }
    } catch (sockErr) {
      console.error('[SOS] Socket broadcast failed:', sockErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'SOS Emergency Alert triggered successfully. Help is on the way.',
      alert
    });
  } catch (error) {
    console.error('Error triggering Vendor SOS:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to trigger SOS alert'
    });
  }
};

