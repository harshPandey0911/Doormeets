const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Admin = require('../models/Admin');
const CategoryTemplate = require('../models/CategoryTemplate');

const PROTECTED_EMAILS = ['admin@harsh.com', 'admin@doormeets.com', 'admin@admin.com'];

const defaultTemplates = [
  {
    name: 'Minute Based Service',
    code: 'MINUTE_BASED',
    schema: {
      fields: [
        { name: 'duration', label: 'Duration (Minutes)', type: 'number', required: true },
        { name: 'pricePerMinute', label: 'Price Per Minute', type: 'number', required: true },
        { name: 'extraTimeCharges', label: 'Extra Time Charges', type: 'number', required: false }
      ]
    },
    blocks: []
  },
  {
    name: 'Package Based Service',
    code: 'PACKAGE_BASED',
    schema: {
      fields: [
        { name: 'packageName', label: 'Package Name', type: 'text', required: true },
        { name: 'packagePrice', label: 'Package Price', type: 'number', required: true },
        { name: 'duration', label: 'Duration', type: 'text', required: false },
        { name: 'includes', label: 'Includes (comma separated)', type: 'textarea', required: false },
        { name: 'notIncludes', label: 'Not Includes (comma separated)', type: 'textarea', required: false }
      ]
    },
    blocks: []
  },
  {
    name: 'Image Based Consultant Service',
    code: 'IMAGE_CONSULTANT',
    schema: {
      fields: [
        { name: 'consultationFee', label: 'Consultation Fee', type: 'number', required: true },
        { name: 'consultationDuration', label: 'Consultation Duration', type: 'text', required: true },
        { name: 'maxUploadImages', label: 'Max Upload Images', type: 'number', required: true, default: 5 },
        { name: 'availableSlots', label: 'Available Slots (comma separated)', type: 'text', required: true }
      ]
    },
    blocks: []
  },
  {
    name: 'Multi Visit Service',
    code: 'MULTI_VISIT',
    schema: {
      fields: [
        { name: 'visitCount', label: 'Visit Count', type: 'number', required: true },
        { name: 'visitSchedule', label: 'Visit Schedule Description', type: 'text', required: true },
        { name: 'warranty', label: 'Warranty Period', type: 'text', required: false },
        { name: 'visitInterval', label: 'Visit Interval (Days)', type: 'number', required: true }
      ]
    },
    blocks: []
  },
  {
    name: 'Dynamic Service Page Template',
    code: 'SERVICE_PAGE',
    schema: {
      fields: []
    },
    blocks: [
      { id: 'image-gallery', name: 'Image Gallery', enabled: true },
      { id: 'banner-slider', name: 'Banner Slider', enabled: true },
      { id: 'heading-text', name: 'Heading & Text Block', enabled: true },
      { id: 'whats-included', name: "What's Included", enabled: true },
      { id: 'whats-not-included', name: "What's Not Included", enabled: true },
      { id: 'warranty', name: 'Warranty', enabled: true },
      { id: 'faq', name: 'FAQ', enabled: true },
      { id: 'reviews', name: 'Reviews', enabled: true },
      { id: 'brands', name: 'Brands', enabled: true },
      { id: 'process', name: 'Process', enabled: true },
      { id: 'rate-card-link', name: 'Rate Card Link', enabled: true },
      { id: 'comparison', name: 'Comparison Section', enabled: true },
      { id: 'offer-banner', name: 'Offer Banner', enabled: true }
    ]
  },
  {
    name: 'Normal Service',
    code: 'NORMAL_SERVICE',
    schema: {
      fields: []
    },
    blocks: []
  },
  {
    name: 'Subscription Based Service',
    code: 'SUBSCRIPTION_BASED',
    schema: {
      fields: [
        { name: 'validityDays', label: 'Validity (Days)', type: 'number', required: true, default: 30 },
        { name: 'visitsCredits', label: 'Visits / Credits', type: 'number', required: true, default: 4 },
        { name: 'benefits', label: 'Benefits (comma separated)', type: 'textarea', required: false }
      ]
    },
    blocks: []
  }
];

const ensureProtectedAccounts = async () => {
  try {
    // 1. User: 7879363299
    let user = await User.findOne({ phone: '7879363299' });
    if (!user) {
      await User.create({
        name: 'User 7879363299',
        phone: '7879363299',
        role: 'user',
        isPhoneVerified: true,
        isActive: true
      });
      console.log('[AutoSeed] Created User 7879363299');
    }

    // 2. Vendor: 7879363299
    let vendor = await Vendor.findOne({ phone: '7879363299' });
    if (!vendor) {
      await Vendor.create({
        name: 'Vendor 7879363299',
        phone: '7879363299',
        role: 'vendor',
        approvalStatus: 'approved',
        isPhoneVerified: true,
        isActive: true
      });
      console.log('[AutoSeed] Created Vendor 7879363299');
    }

    // 3. Admin: admin@Doormeets.com
    let admin1 = await Admin.findOne({ email: 'admin@doormeets.com' });
    if (!admin1) {
      await Admin.create({
        name: 'DoorMeets Admin',
        email: 'admin@doormeets.com',
        password: 'admin123',
        role: 'SUPER_ADMIN',
        isActive: true,
        canApproveVendors: true,
        canApproveWorkers: true
      });
      console.log('[AutoSeed] Created Admin admin@Doormeets.com');
    }

    // 4. Protected Admin: admin@harsh.com
    let admin2 = await Admin.findOne({ email: 'admin@harsh.com' });
    if (!admin2) {
      await Admin.create({
        name: 'Harsh Admin',
        email: 'admin@harsh.com',
        password: 'harsh123',
        role: 'SUPER_ADMIN',
        isActive: true,
        canApproveVendors: true,
        canApproveWorkers: true
      });
      console.log('[AutoSeed] Created Protected Admin admin@harsh.com');
    }

    // 5. Ensure Category Templates exist
    for (const t of defaultTemplates) {
      const exists = await CategoryTemplate.findOne({ code: t.code });
      if (!exists) {
        await CategoryTemplate.create(t);
        console.log(`[AutoSeed] Created CategoryTemplate ${t.code}`);
      }
    }
  } catch (err) {
    console.error('[AutoSeed] Error ensuring protected accounts & templates:', err.message);
  }
};

module.exports = { ensureProtectedAccounts, PROTECTED_EMAILS };
