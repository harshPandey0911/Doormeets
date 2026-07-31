const ShopOwner = require('../../models/ShopOwner');
const Vendor = require('../../models/Vendor');
const Settings = require('../../models/Settings');
const QRCode = require('qrcode');

/**
 * Get Shop Owner Dashboard stats and referred vendors
 */
const getDashboardDetails = async (req, res) => {
  try {
    const shopOwner = await ShopOwner.findById(req.user.id);
    if (!shopOwner) {
      return res.status(404).json({ success: false, message: 'Shop owner not found.' });
    }

    // Fetch referral settings
    const settings = await Settings.findOne({ type: 'global' });
    const shopOwnerReward = settings?.shopReferralRewardShopOwner || 100;
    const vendorReward = settings?.shopReferralRewardVendor || 50;
    const adminQrCodeUrl = settings?.shopReferralQrCodeUrl || null;

    // Fetch referred vendors
    const vendors = await Vendor.find({ referredByShopOwner: shopOwner._id })
      .select('name phone approvalStatus policeVerification training createdAt referralCode')
      .sort({ createdAt: -1 });

    // Calculate referral stats
    const totalReferred = vendors.length;
    const pendingApproval = vendors.filter(v => v.approvalStatus === 'pending').length;
    const approved = vendors.filter(v => v.approvalStatus === 'approved').length;
    const rejected = vendors.filter(v => v.approvalStatus === 'rejected').length;

    // Generate dynamic QR Code for inviting vendors
    // e.g. links to frontend vendor registration page with referral code
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = shopOwner.inviteLink || `${frontendUrl}/vendor/register?ref=${shopOwner.referralCode}`;
    
    let inviteQrCodeDataUrl = '';
    try {
      inviteQrCodeDataUrl = await QRCode.toDataURL(inviteLink);
    } catch (err) {
      console.error('Failed to generate invite QR code:', err);
    }

    res.status(200).json({
      success: true,
      data: {
        walletBalance: shopOwner.wallet?.balance || 0,
        referralCode: shopOwner.referralCode,
        inviteLink,
        inviteQrCodeDataUrl,
        adminQrCodeUrl,
        stats: {
          totalReferred,
          pendingApproval,
          approved,
          rejected,
          rewardsConfig: {
            shopOwnerReward,
            vendorReward
          }
        },
        vendors
      }
    });
  } catch (error) {
    console.error('Get Shop Owner Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.' });
  }
};

const updateReferralCode = async (req, res) => {
  try {
    const { referralCode, inviteLink } = req.body;

    const shopOwner = await ShopOwner.findById(req.user.id);
    if (!shopOwner) {
      return res.status(404).json({ success: false, message: 'Shop owner not found.' });
    }

    if (inviteLink !== undefined) {
      // User is editing the entire link
      shopOwner.inviteLink = inviteLink.trim();

      // Extract referral code from the new link
      let customCode = inviteLink.trim();
      if (customCode.includes('ref=')) {
        customCode = customCode.split('ref=')[1];
      } else if (customCode.includes('?')) {
        customCode = customCode.split('?')[1];
      }
      customCode = customCode.replace(/[\/\s]/g, '').toUpperCase();

      if (customCode && customCode.length >= 3 && customCode.length <= 20) {
        // Verify code is not taken
        const existingShop = await ShopOwner.findOne({
          referralCode: customCode,
          _id: { $ne: req.user.id }
        });
        if (!existingShop) {
          const User = require('../../models/User');
          const [existingVendor, existingUser] = await Promise.all([
            Vendor.findOne({ referralCode: customCode }),
            User.findOne({ referralCode: customCode })
          ]);
          if (!existingVendor && !existingUser) {
            shopOwner.referralCode = customCode;
          }
        }
      }
      await shopOwner.save();
    } else {
      // Existing referralCode direct update logic
      if (!referralCode) {
        return res.status(400).json({ success: false, message: 'Referral code is required.' });
      }

      const formattedCode = referralCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (formattedCode.length < 3 || formattedCode.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Referral code must be between 3 and 20 characters (letters, numbers, hyphens, or underscores only).'
        });
      }

      const existingShop = await ShopOwner.findOne({
        referralCode: formattedCode,
        _id: { $ne: req.user.id }
      });
      if (existingShop) {
        return res.status(400).json({ success: false, message: 'This referral code is already taken. Please choose another one.' });
      }

      const User = require('../../models/User');
      const [existingVendor, existingUser] = await Promise.all([
        Vendor.findOne({ referralCode: formattedCode }),
        User.findOne({ referralCode: formattedCode })
      ]);
      if (existingVendor || existingUser) {
        return res.status(400).json({ success: false, message: 'This referral code is already taken. Please choose another one.' });
      }

      shopOwner.referralCode = formattedCode;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      shopOwner.inviteLink = `${frontendUrl}/vendor/register?ref=${formattedCode}`;
      await shopOwner.save();
    }

    const currentInviteLink = shopOwner.inviteLink || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/vendor/register?ref=${shopOwner.referralCode}`;
    let inviteQrCodeDataUrl = '';
    try {
      inviteQrCodeDataUrl = await QRCode.toDataURL(currentInviteLink);
    } catch (err) {
      console.error('Failed to generate invite QR code:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Referral code/Invite link updated successfully.',
      data: {
        referralCode: shopOwner.referralCode,
        inviteLink: currentInviteLink,
        inviteQrCodeDataUrl
      }
    });
  } catch (error) {
    console.error('Update Referral Code error:', error);
    res.status(500).json({ success: false, message: 'Failed to update referral code/invite link.' });
  }
};

module.exports = {
  getDashboardDetails,
  updateReferralCode
};

