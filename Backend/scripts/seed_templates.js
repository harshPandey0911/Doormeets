const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const CategoryTemplate = require('../models/CategoryTemplate');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

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

const seedTemplates = async () => {
  try {
    await connectDB();
    console.log('Connected to Database. Seeding Category Templates...');

    for (const t of defaultTemplates) {
      const exists = await CategoryTemplate.findOne({ code: t.code });
      if (exists) {
        console.log(`Template ${t.code} already exists, updating...`);
        await CategoryTemplate.updateOne({ code: t.code }, t);
      } else {
        console.log(`Creating template ${t.code}...`);
        await CategoryTemplate.create(t);
      }
    }

    console.log('Category Templates seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed category templates:', error);
    process.exit(1);
  }
};

seedTemplates();
