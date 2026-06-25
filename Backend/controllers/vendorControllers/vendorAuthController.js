const Vendor = require('../../models/Vendor');
const { generateOTP, hashOTP, storeOTP, verifyOTP, checkRateLimit } = require('../../utils/redisOtp.util');
const { generateTokenPair, verifyRefreshToken, generateVerificationToken, verifyVerificationToken } = require('../../utils/tokenService');
const { sendOTP: sendSMSOTP } = require('../../services/smsService');
const cloudinaryService = require('../../services/cloudinaryService');
const { USER_ROLES, VENDOR_STATUS } = require('../../utils/constants');
const { validationResult } = require('express-validator');

/**
 * Send OTP for vendor registration/login
 */
const sendOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
    }

    // Check existing vendor status to prevent OTP if restricted
    const existingVendor = await Vendor.findOne({ phone: cleanPhone });
    
    // User requested: If not registered, do not send OTP, tell them to register first.
    if (!existingVendor) {
      return res.status(404).json({
        success: false,
        message: 'Number not registered. Please register first.'
      });
    }

    if (existingVendor.approvalStatus === VENDOR_STATUS.REJECTED || existingVendor.approvalStatus === VENDOR_STATUS.SUSPENDED) {
      return res.status(403).json({ success: false, message: 'Account restricted.' });
    }

    // 1. Rate limit check
    const allowed = await checkRateLimit(cleanPhone);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again after 10 minutes.'
      });
    }

    // 2. Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    // 3. Store OTP (Redis primary, MongoDB fallback)
    await storeOTP(cleanPhone, otpHash);

    // 4. Send OTP via SMS
    const smsResult = await sendSMSOTP(cleanPhone, otp);

    // Log OTP in development mode
    if (process.env.NODE_ENV === 'development' || process.env.USE_DEFAULT_OTP === 'true') {
      console.log(`[DEV] Vendor OTP for ${phone}: ${otp}`);
    }

    if (!smsResult.success) {
      console.warn(`[OTP] SMS failed for vendor ${phone}, but OTP stored`);
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      token: 'verification-pending'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
};

/**
 * Verify OTP and Check Vendor Status (Unified Login/Signup Entry)
 */
const verifyLogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // 1. Verify OTP
    const verification = await verifyOTP(phone, otp);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // 2. Check if vendor exists (using sanitized phone)
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const vendor = await Vendor.findOne({ phone: cleanPhone });

    if (vendor) {
      // EXISTING VENDOR

      // Check status checks (Login Logic)
      if (vendor.approvalStatus === VENDOR_STATUS.REJECTED) {
        return res.status(200).json({
          success: true,
          message: 'Your account application has been rejected.',
          vendor: { 
            adminApproval: 'rejected',
            rejectedReason: vendor.rejectedReason || 'Your application did not meet our requirements.'
          }
        });
      }
      if (vendor.approvalStatus === VENDOR_STATUS.SUSPENDED) {
        return res.status(403).json({ success: false, message: 'Account suspended.' });
      }
      if (!vendor.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated.' });
      }

      // PENDING VENDORS ARE ALLOWED TO LOGIN TO COMPLETE VERIFICATION
      if (vendor.approvalStatus === VENDOR_STATUS.PENDING) {
         // Proceed to generate tokens
      }

      // SINGLE DEVICE LOGIN: Update Session ID & Clear OLD FCM tokens
      const loginSessionId = Date.now().toString();
      await Vendor.findByIdAndUpdate(vendor._id, { 
        loginSessionId,
        $set: { fcmTokens: [], fcmTokenMobile: [] } // Clear all old tokens to prevent ghost notifications
      });

      const tokens = generateTokenPair({
        userId: vendor._id,
        role: USER_ROLES.VENDOR,
        loginSessionId
      });

      return res.status(200).json({
        success: true,
        isNewUser: false,
        message: 'Login successful',
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          businessName: vendor.businessName,
          service: vendor.service,
          approvalStatus: vendor.approvalStatus,
          isSubscriptionActive: vendor.isSubscriptionActive,
          subscription: vendor.subscription
        },
        ...tokens
      });

    } else {
      // NEW VENDOR -> RETURN VERIFICATION TOKEN
      const verificationToken = generateVerificationToken(phone);

      return res.status(200).json({
        success: true,
        isNewUser: true,
        message: 'OTP verified. Please complete registration.',
        verificationToken
      });
    }

  } catch (error) {
    console.error('Verify Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

/**
 * Register vendor with Verification Token (Service/Category Removed)
 */
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    // Ignore service validation error if present (since removed)
    const validErrors = errors.array().filter(e => e.path !== 'service');

    if (validErrors.length > 0) {
      console.log('[REGISTER] Validation errors:', validErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validErrors
      });
    }

    const { name, professionId } = req.body;
    let phone = req.body.phone;

    // Direct registration without OTP
    phone = phone.replace(/\D/g, '').slice(-10);

    // Check existing (using sanitized phone)
    const existing = await Vendor.findOne({ phone });
    if (existing) {
      console.log('[REGISTER] Conflict found: Phone');
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number already registered.',
        isPhoneConflict: true
      });
    }

    // Process Professions
    let finalCategories = [];
    if (professionId) {
      const Profession = require('../../models/Profession');
      const professionData = await Profession.findById(professionId);
      if (professionData && professionData.categories && professionData.categories.length > 0) {
        finalCategories = professionData.categories.map(c => c.toString());
      }
    }

    // Calculate Police Verification Due Date
    const Settings = require('../../models/Settings');
    let policeVerificationDays = 7;
    try {
      const settings = await Settings.findOne({ type: 'global' });
      if (settings && settings.policeVerificationDays) {
        policeVerificationDays = settings.policeVerificationDays;
      }
    } catch (err) {
      console.error('Error fetching settings for PV days:', err);
    }
    const pvDueDate = new Date();
    pvDueDate.setDate(pvDueDate.getDate() + policeVerificationDays);

    // Create Vendor Record
    const vendor = await Vendor.create({
      name,
      phone,
      professions: professionId ? [professionId] : [],
      categories: finalCategories,
      approvalStatus: VENDOR_STATUS.PENDING,
      isActive: true, // Allow them to attempt login but blocked by PENDING status
      settings: { serviceRange: 15 },
      policeVerification: {
        status: 'pending',
        dueDate: pvDueDate
      }
    });

    // Notify Admins (Non-blocking)
    (async () => {
      try {
        const { createNotification } = require('../notificationControllers/notificationController');
        const Admin = require('../../models/Admin');
        const admins = await Admin.find({ role: 'super_admin' });
        
        const notificationData = {
          type: 'new_vendor_registration',
          title: 'New Vendor Registration',
          message: `A new vendor ${name} has registered and is awaiting approval.`,
          relatedId: vendor._id,
          relatedType: 'vendor'
        };

        await Promise.all(admins.map(admin => 
          createNotification({ ...notificationData, adminId: admin._id })
        ));
      } catch (e) {
        console.error('Non-blocking admin notification error:', e);
      }
    })();

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now login.',
      vendor: {
        id: vendor._id,
        name: vendor.name,
        phone: vendor.phone,
        approvalStatus: vendor.approvalStatus
      }
    });

  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json({
      success: false,
      message: `Registration failed. Error: ${error.message}`
    });
  }
};

/**
 * Login vendor with OTP (only if approved)
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone, otp } = req.body;

    // Verify OTP (checks Redis first, falls back to MongoDB)
    const verification = await verifyOTP(phone, otp);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Find vendor
    const vendor = await Vendor.findOne({ phone });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found. Please sign up first.'
      });
    }

    // Check approval status
    if (vendor.approvalStatus === VENDOR_STATUS.PENDING) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval. Please wait for approval.'
      });
    }

    if (vendor.approvalStatus === VENDOR_STATUS.REJECTED) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been rejected. Please contact support.'
      });
    }

    if (vendor.approvalStatus === VENDOR_STATUS.SUSPENDED) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    if (!vendor.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // SINGLE DEVICE LOGIN: Update Session ID & Clear OLD FCM tokens
    const loginSessionId = Date.now().toString();
    await Vendor.findByIdAndUpdate(vendor._id, { 
      loginSessionId,
      $set: { fcmTokens: [], fcmTokenMobile: [] } // Clear all old tokens to prevent ghost notifications
    });

    // Generate JWT tokens
    const tokens = generateTokenPair({
      userId: vendor._id,
      role: USER_ROLES.VENDOR,
      loginSessionId
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        businessName: vendor.businessName,
        service: vendor.service,
        approvalStatus: vendor.approvalStatus,
        isSubscriptionActive: vendor.isSubscriptionActive,
        subscription: vendor.subscription
      },
      ...tokens
    });
  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

/**
 * Logout vendor
 */
const logout = async (req, res) => {
  try {
    const { platform = 'web' } = req.body;

    // Clear FCM tokens based on platform and reset Session ID
    if (req.user && req.user.id) {
      const updateQuery = platform === 'mobile'
        ? { $set: { fcmTokenMobile: [], loginSessionId: null } }
        : { $set: { fcmTokens: [], loginSessionId: null } };

      await Vendor.findByIdAndUpdate(req.user.id, updateQuery);
      console.log(`[AUTH] ✅ ${platform} session & tokens cleared for vendor: ${req.user.id}`);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * Refresh Access Token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findById(decoded.userId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check status
    if (vendor.approvalStatus !== VENDOR_STATUS.APPROVED || !vendor.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is not approved or is inactive'
      });
    }

    // Verify Session ID for Vendor
    if (process.env.NODE_ENV === 'production' && decoded.loginSessionId !== vendor.loginSessionId) {
      return res.status(401).json({
        success: false,
        message: 'Account logged in on a new device. Please login again.'
      });
    }

    // Generate new token pair with same session ID
    const tokens = generateTokenPair({
      userId: vendor._id,
      role: USER_ROLES.VENDOR,
      loginSessionId: vendor.loginSessionId
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      ...tokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token'
    });
  }
};

/**
 * Get vendor registration/verification status
 */
const getRegistrationStatus = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await Vendor.findById(vendorId).select('approvalStatus policeVerification rejectedReason isSubscriptionActive');
    
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    res.status(200).json({
      success: true,
      vendor: {
        id: vendor._id,
        approvalStatus: vendor.approvalStatus,
        policeVerification: vendor.policeVerification,
        rejectedReason: vendor.rejectedReason,
        isSubscriptionActive: vendor.isSubscriptionActive
      }
    });
  } catch (error) {
    console.error('Get registration status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  sendOTP,
  verifyLogin,
  register,
  login,
  logout,
  refreshToken,
  getRegistrationStatus
};
