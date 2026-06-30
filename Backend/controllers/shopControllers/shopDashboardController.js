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
      .select('name phone approvalStatus policeVerification training createdAt')
      .sort({ createdAt: -1 });

    // Calculate referral stats
    const totalReferred = vendors.length;
    const pendingApproval = vendors.filter(v => v.approvalStatus === 'pending').length;
    const approved = vendors.filter(v => v.approvalStatus === 'approved').length;
    const rejected = vendors.filter(v => v.approvalStatus === 'rejected').length;

    // Generate dynamic QR Code for inviting vendors
    // e.g. links to frontend vendor registration page with referral code
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/vendor/register?ref=${shopOwner.referralCode}`;
    
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

module.exports = {
  getDashboardDetails
};
