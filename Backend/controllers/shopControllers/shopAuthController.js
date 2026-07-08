const ShopOwner = require('../../models/ShopOwner');
const { generateTokenPair } = require('../../utils/tokenService');
const { USER_ROLES } = require('../../utils/constants');

/**
 * Register a new Shop Owner
 */
const register = async (req, res) => {
  try {
    const { name, phone, email, businessName, password } = req.body;

    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number.' });
    }

    const existing = await ShopOwner.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Phone number already registered.' });
    }

    // Generate unique referral code
    let referralCode;
    let codeExists = true;
    while (codeExists) {
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      referralCode = `SH-${rand}`;
      const found = await ShopOwner.findOne({ referralCode });
      if (!found) codeExists = false;
    }

    const shopOwner = await ShopOwner.create({
      name,
      phone: cleanPhone,
      email,
      businessName,
      password,
      referralCode
    });

    const loginSessionId = Date.now().toString();
    const tokens = generateTokenPair({
      userId: shopOwner._id,
      role: 'shop_owner',
      loginSessionId
    });

    res.status(201).json({
      success: true,
      message: 'Shop Owner registered successfully.',
      data: {
        id: shopOwner._id,
        name: shopOwner.name,
        phone: shopOwner.phone,
        email: shopOwner.email,
        businessName: shopOwner.businessName,
        referralCode: shopOwner.referralCode,
        wallet: shopOwner.wallet
      },
      ...tokens
    });
  } catch (error) {
    console.error('Shop Owner Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

/**
 * Login Shop Owner
 */
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    const shopOwner = await ShopOwner.findOne({ phone: cleanPhone }).select('+password');

    if (!shopOwner) {
      return res.status(400).json({ success: false, message: 'Invalid phone or password.' });
    }

    if (!shopOwner.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    const isMatch = await shopOwner.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid phone or password.' });
    }

    const loginSessionId = Date.now().toString();
    const tokens = generateTokenPair({
      userId: shopOwner._id,
      role: 'shop_owner',
      loginSessionId
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        id: shopOwner._id,
        name: shopOwner.name,
        phone: shopOwner.phone,
        email: shopOwner.email,
        businessName: shopOwner.businessName,
        referralCode: shopOwner.referralCode,
        wallet: shopOwner.wallet
      },
      ...tokens
    });
  } catch (error) {
    console.error('Shop Owner Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

/**
 * Get Shop Owner Profile
 */
const getProfile = async (req, res) => {
  try {
    const shopOwner = await ShopOwner.findById(req.user.id);
    if (!shopOwner) {
      return res.status(404).json({ success: false, message: 'Shop owner not found.' });
    }

    res.status(200).json({
      success: true,
      data: shopOwner
    });
  } catch (error) {
    console.error('Get Shop Owner Profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

const forgotPasswordSendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number.' });
    }

    const shopOwner = await ShopOwner.findOne({ phone: cleanPhone });
    if (!shopOwner) {
      return res.status(404).json({ success: false, message: 'No registered account found with this phone number.' });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully. (Use default OTP 123456)'
    });
  } catch (error) {
    console.error('Forgot password send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

const forgotPasswordReset = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    
    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const shopOwner = await ShopOwner.findOne({ phone: cleanPhone });
    if (!shopOwner) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    shopOwner.password = newPassword;
    await shopOwner.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful.'
    });
  } catch (error) {
    console.error('Forgot password reset error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  forgotPasswordSendOtp,
  forgotPasswordReset
};
