const Vendor = require('../../models/Vendor');
const Settings = require('../../models/Settings');
const Profession = require('../../models/Profession');

/**
 * Add a new vendor by Shop Owner
 */
const addVendor = async (req, res) => {
  try {
    const { name, phone, professionId } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
    }

    const existingVendor = await Vendor.findOne({ phone: cleanPhone });
    if (existingVendor) {
      return res.status(400).json({ success: false, message: 'Vendor with this phone number is already registered.' });
    }

    // Process categories based on Profession
    let finalCategories = [];
    if (professionId) {
      const professionData = await Profession.findById(professionId);
      if (professionData && professionData.categories && professionData.categories.length > 0) {
        finalCategories = professionData.categories.map(c => c.toString());
      }
    }

    // Calculate Police Verification Due Date from settings
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

    // Generate unique referral code
    let referralCode;
    let codeExists = true;
    while (codeExists) {
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      referralCode = `VN-${rand}`;
      const found = await Vendor.findOne({ referralCode });
      if (!found) codeExists = false;
    }

    const vendor = await Vendor.create({
      name,
      phone: cleanPhone,
      professions: professionId ? [professionId] : [],
      categories: finalCategories,
      approvalStatus: 'pending',
      referredByShopOwner: req.user.id,
      policeVerification: {
        status: 'pending',
        dueDate: pvDueDate
      },
      referralCode
    });

    res.status(201).json({
      success: true,
      message: 'Vendor registered successfully. The vendor can now complete onboarding on their app/panel.',
      data: {
        id: vendor._id,
        name: vendor.name,
        phone: vendor.phone,
        approvalStatus: vendor.approvalStatus
      }
    });
  } catch (error) {
    console.error('Add Vendor error:', error);
    res.status(500).json({ success: false, message: 'Failed to onboard vendor.' });
  }
};

module.exports = {
  addVendor
};
