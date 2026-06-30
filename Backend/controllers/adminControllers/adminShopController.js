const ShopOwner = require('../../models/ShopOwner');
const Vendor = require('../../models/Vendor');
const Transaction = require('../../models/Transaction');

/**
 * Get all shop owners with search and pagination
 */
const getAllShopOwners = async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const shopOwners = await ShopOwner.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ShopOwner.countDocuments(query);

    // Get referral count for each shop owner
    const shopOwnersWithStats = await Promise.all(shopOwners.map(async (shop) => {
      const referralsCount = await Vendor.countDocuments({ referredByShopOwner: shop._id });
      return {
        ...shop.toObject(),
        referralsCount
      };
    }));

    res.status(200).json({
      success: true,
      data: shopOwnersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all shop owners error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shop owners.' });
  }
};

/**
 * Get detailed stats and referrals of a specific shop owner
 */
const getShopOwnerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const shopOwner = await ShopOwner.findById(id);

    if (!shopOwner) {
      return res.status(404).json({ success: false, message: 'Shop owner not found.' });
    }

    // Fetch referred vendors
    const referrals = await Vendor.find({ referredByShopOwner: shopOwner._id })
      .select('name phone approvalStatus createdAt');

    // Fetch transaction logs
    const transactions = await Transaction.find({ shopOwnerId: shopOwner._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        shopOwner,
        referrals,
        transactions
      }
    });
  } catch (error) {
    console.error('Get shop owner details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch details.' });
  }
};

/**
 * Update active/inactive status of shop owner
 */
const updateShopOwnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ success: false, message: 'isActive status is required.' });
    }

    const shopOwner = await ShopOwner.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!shopOwner) {
      return res.status(404).json({ success: false, message: 'Shop owner not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Shop owner ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: shopOwner
    });
  } catch (error) {
    console.error('Update shop owner status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
};

/**
 * Directly adjust shop owner's wallet balance
 */
const adjustShopOwnerWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, type = 'credit' } = req.body;

    if (!amount || amount <= 0 || !description) {
      return res.status(400).json({ success: false, message: 'Amount and description are required.' });
    }

    const shopOwner = await ShopOwner.findById(id);
    if (!shopOwner) {
      return res.status(404).json({ success: false, message: 'Shop owner not found.' });
    }

    const balanceBefore = shopOwner.wallet?.balance || 0;
    const change = type === 'credit' ? amount : -amount;
    const balanceAfter = balanceBefore + change;

    if (balanceAfter < 0) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance for this operation.' });
    }

    shopOwner.wallet = shopOwner.wallet || { balance: 0 };
    shopOwner.wallet.balance = balanceAfter;
    await shopOwner.save();

    // Create transaction log
    await Transaction.create({
      shopOwnerId: shopOwner._id,
      type: type === 'credit' ? 'shop_referral_earned' : 'withdrawal',
      amount,
      status: 'completed',
      paymentMethod: 'system',
      description: `Admin adjustment: ${description}`,
      balanceBefore,
      balanceAfter
    });

    res.status(200).json({
      success: true,
      message: 'Wallet balance adjusted successfully.',
      data: shopOwner
    });
  } catch (error) {
    console.error('Adjust shop owner wallet error:', error);
    res.status(500).json({ success: false, message: 'Failed to adjust wallet.' });
  }
};

module.exports = {
  getAllShopOwners,
  getShopOwnerDetails,
  updateShopOwnerStatus,
  adjustShopOwnerWallet
};
