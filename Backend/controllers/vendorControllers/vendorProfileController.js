const mongoose = require('mongoose');
const Vendor = require('../../models/Vendor');
const { validationResult } = require('express-validator');
const cloudinaryService = require('../../services/cloudinaryService');

/**
 * Get vendor profile
 */
const getProfile = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const vendor = await Vendor.findById(vendorId).select('-password -__v');
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Use stored rating if available (and > 0), otherwise calculate
    let rating = vendor.rating || 0;

    const Booking = require('../../models/Booking');

    if (rating === 0) {
      const [ratingData] = await Booking.aggregate([
        { $match: { vendorId: new mongoose.Types.ObjectId(vendorId), rating: { $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]);
      rating = ratingData ? ratingData.avgRating : 0;
    }

    const totalJobs = await Booking.countDocuments({ vendorId });
    const completedJobs = await Booking.countDocuments({ vendorId, status: 'completed' });
    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    res.status(200).json({
      success: true,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        businessName: vendor.businessName || null,
        email: vendor.email,
        phone: vendor.phone,
        service: vendor.service,
        skills: vendor.skills || [],
        address: vendor.address || null,
        rating: rating > 0 ? parseFloat(rating.toFixed(1)) : 0,
        totalJobs,
        completionRate,
        approvalStatus: vendor.approvalStatus,
        isPhoneVerified: vendor.isPhoneVerified || false,
        isEmailVerified: vendor.isEmailVerified || false,
        profilePhoto: vendor.profilePhoto || null,
        aadhar: vendor.aadhar || null,
        pan: vendor.pan || null,
        policeVerification: vendor.policeVerification || null,
        isOnline: vendor.isOnline || false,
        availability: vendor.availability || 'OFFLINE',
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt
      }
    });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile. Please try again.'
    });
  }
};

/**
 * Update vendor profile
 */
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendorId = req.user.id;
    const { name, businessName, address, profilePhoto, serviceCategory, skills, aadharNumber, aadharDocument, aadharBackDocument, panNumber, panDocument, serviceRange, policeVerificationMethod } = req.body;

    console.log('Update Vendor Profile Body:', JSON.stringify(req.body, null, 2));

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Handle police verification choice & grace period
    if (policeVerificationMethod) {
      const Settings = require('../../models/Settings');
      let graceDays = 7;
      try {
        const settings = await Settings.findOne({ type: 'global' });
        if (settings && settings.policeVerificationDays) {
          graceDays = settings.policeVerificationDays;
        }
      } catch (err) {
        console.error('Error fetching settings for PV days:', err);
      }

      vendor.policeVerification = vendor.policeVerification || {};
      
      // If method is changed, reset previous document and status to pending
      if (vendor.policeVerification.method !== policeVerificationMethod) {
        vendor.policeVerification.status = 'pending';
      }

      vendor.policeVerification.method = policeVerificationMethod;
      vendor.policeVerification.isGracePeriodActive = true;
      
      // If method is admin, clear any self-uploaded document
      if (policeVerificationMethod === 'admin') {
        vendor.policeVerification.documentUrl = null;
      }
      
      const pvDueDate = new Date();
      pvDueDate.setDate(pvDueDate.getDate() + graceDays);
      vendor.policeVerification.dueDate = pvDueDate;
    }

    if (vendor.approvalStatus === 'rejected') {
      vendor.approvalStatus = 'pending';
    }

    // Update fields
    if (name) vendor.name = name.trim();
    if (businessName !== undefined) vendor.businessName = businessName ? businessName.trim() : null;
    if (address) {
      if (typeof address === 'string') {
        // If address is coming as string from simple form
        vendor.address = {
          ...vendor.address,
          fullAddress: address
        };
      } else {
        // Address is an object from advanced picker
        vendor.address = {
          fullAddress: address.fullAddress || vendor.address?.fullAddress || '',
          addressLine1: address.addressLine1 || vendor.address?.addressLine1 || '',
          addressLine2: address.addressLine2 || vendor.address?.addressLine2 || '',
          city: address.city || vendor.address?.city || '',
          state: address.state || vendor.address?.state || '',
          pincode: address.pincode || vendor.address?.pincode || '',
          landmark: address.landmark || vendor.address?.landmark || '',
          lat: address.lat !== undefined ? address.lat : vendor.address?.lat,
          lng: address.lng !== undefined ? address.lng : vendor.address?.lng
        };

        // Sync GeoJSON geoLocation for fast geo queries
        if (vendor.address.lat && vendor.address.lng) {
          vendor.geoLocation = {
            type: 'Point',
            coordinates: [vendor.address.lng, vendor.address.lat] // [lng, lat]
          };
        }
      }
    }

    // Update profile photo - upload to Cloudinary if it's a base64 string
    if (profilePhoto !== undefined) {
      if (profilePhoto && profilePhoto.startsWith('data:')) {
        const uploadRes = await cloudinaryService.uploadFile(profilePhoto, { folder: 'vendors/profiles' });
        if (uploadRes.success) {
          vendor.profilePhoto = uploadRes.url;
        }
      } else {
        vendor.profilePhoto = profilePhoto;
      }
    }

    // Handle multiple service categories
    if (serviceCategory !== undefined) {
      if (Array.isArray(serviceCategory)) {
        vendor.service = serviceCategory;
        vendor.categories = serviceCategory; // Sync categories field too
      } else if (typeof serviceCategory === 'string') {
        // If string, likely single value or comma separated
        vendor.service = [serviceCategory];
        vendor.categories = [serviceCategory];
      }
    }

    // Handle service range
    if (serviceRange !== undefined) {
      if (!vendor.settings) vendor.settings = {};
      vendor.settings.serviceRange = Number(serviceRange) || 10;
    }

    // Handle skills
    if (skills !== undefined) {
      vendor.skills = Array.isArray(skills) ? skills : [];
    }
    // If aadharDocument/aadharBackDocument exists and is not empty, update it
    if (aadharDocument || aadharBackDocument || aadharNumber) {
      let aadharUrl = aadharDocument || vendor.aadhar?.document;
      if (aadharUrl && aadharUrl.startsWith('data:')) {
        const uploadRes = await cloudinaryService.uploadFile(aadharUrl, { folder: 'vendors/documents' });
        if (uploadRes.success) aadharUrl = uploadRes.url;
      }

      let aadharBackUrl = aadharBackDocument || vendor.aadhar?.backDocument;
      if (aadharBackUrl && aadharBackUrl.startsWith('data:')) {
        const uploadRes = await cloudinaryService.uploadFile(aadharBackUrl, { folder: 'vendors/documents' });
        if (uploadRes.success) aadharBackUrl = uploadRes.url;
      }

      if (vendor.aadhar) {
        if (aadharNumber) vendor.aadhar.number = aadharNumber;
        if (aadharDocument) vendor.aadhar.document = aadharUrl;
        if (aadharBackDocument) vendor.aadhar.backDocument = aadharBackUrl;
      } else {
        vendor.aadhar = {
          number: aadharNumber || '',
          document: aadharUrl || '',
          backDocument: aadharBackUrl || ''
        };
      }
    }

    // If panDocument exists and is not empty, update it
    if (panDocument || panNumber) {
      let panUrl = panDocument || vendor.pan?.document;
      if (panUrl && panUrl.startsWith('data:')) {
        const uploadRes = await cloudinaryService.uploadFile(panUrl, { folder: 'vendors/documents' });
        if (uploadRes.success) panUrl = uploadRes.url;
      }

      if (vendor.pan) {
        if (panNumber) vendor.pan.number = panNumber;
        if (panDocument) vendor.pan.document = panUrl;
      } else {
        vendor.pan = {
          number: panNumber || '',
          document: panUrl || ''
        };
      }
    }

    await vendor.save();

    // Auto-assign to City Admins if city is set/updated
    if (vendor.address && vendor.address.city) {
      try {
        const City = require('../../models/City');
        const Admin = require('../../models/Admin');

        // Find the city document matching the vendor's city name
        const cityDoc = await City.findOne({ name: new RegExp(`^${vendor.address.city}$`, 'i') });
        if (cityDoc) {
          // Add this vendor to all City Admins assigned to this city
          await Admin.updateMany(
            {
              role: { $in: ['CITY_ADMIN', 'admin'] },
              assignedCities: cityDoc._id
            },
            { $addToSet: { assignedVendors: vendor._id } }
          );
        }
      } catch (assignError) {
        console.error('Error auto-assigning vendor to city admins:', assignError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      vendor: {
        id: vendor._id,
        name: vendor.name,
        businessName: vendor.businessName,
        email: vendor.email,
        phone: vendor.phone,
        service: vendor.service,
        address: vendor.address,
        approvalStatus: vendor.approvalStatus,
        isPhoneVerified: vendor.isPhoneVerified,
        isEmailVerified: vendor.isEmailVerified,
        profilePhoto: vendor.profilePhoto,
        skills: vendor.skills,
        settings: vendor.settings,
        isOnline: vendor.isOnline || false,
        availability: vendor.availability || 'OFFLINE'
      }
    });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile. Please try again.'
    });
  }
};

/**
 * Update vendor address
 */
const updateAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendorId = req.user.id;
    const { fullAddress, lat, lng } = req.body;

    if (!fullAddress || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Full address and coordinates are required'
      });
    }

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Update address with coordinates
    vendor.address = {
      ...vendor.address,
      fullAddress: fullAddress.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };

    // Sync GeoJSON geoLocation
    vendor.geoLocation = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };

    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address: vendor.address
    });
  } catch (error) {
    console.error('Update vendor address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address. Please try again.'
    });
  }
};

/**
 * Update vendor real-time location
 */
const updateLocation = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }

    // Update only the location field
    await Vendor.findByIdAndUpdate(vendorId, {
      location: { lat, lng, updatedAt: new Date() },
      geoLocation: {
        type: 'Point',
        coordinates: [lng, lat]
      }
    });

    res.status(200).json({ success: true, message: 'Location updated' });
  } catch (error) {
    console.error('Vendor location update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Toggle online/offline status
 */
const updateStatus = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { isOnline } = req.body;

    if (isOnline === undefined) {
      return res.status(400).json({ success: false, message: 'isOnline status is required' });
    }

    const isWorkerRole = req.userRole === 'WORKER' || req.user?.role === 'WORKER';

    if (isWorkerRole) {
      const Worker = require('../../models/Worker');
      const worker = await Worker.findById(vendorId);
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      worker.status = isOnline ? 'ONLINE' : 'OFFLINE';
      await worker.save();

      return res.status(200).json({
        success: true,
        message: `Worker status updated to ${isOnline ? 'Online' : 'Offline'}`,
        isOnline,
        availability: worker.status
      });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    vendor.isOnline = isOnline;
    vendor.availability = isOnline ? 'AVAILABLE' : 'OFFLINE';
    vendor.availabilityStatus = isOnline ? 'ONLINE' : 'OFFLINE';

    // Set lastSeenAt if going offline
    if (!isOnline) {
      vendor.lastSeenAt = new Date();
    }

    await vendor.save();

    // Sync to Redis cache (fast lookup)
    try {
      const { setVendorOnline, setVendorAvailability } = require('../../services/redisService');
      await setVendorOnline(vendorId, isOnline);
      await setVendorAvailability(vendorId, vendor.availability);
    } catch (redisErr) {
      console.error('[UpdateStatus] Redis sync failed:', redisErr);
    }

    res.status(200).json({
      success: true,
      message: `Status updated to ${isOnline ? 'Online' : 'Offline'}`,
      isOnline: vendor.isOnline,
      availability: vendor.availability
    });
  } catch (error) {
    console.error('Vendor status update error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating status' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAddress,
  updateLocation,
  updateStatus
};

