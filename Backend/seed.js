const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civilconnect';

// Import Models
const City = require('./models/City');
const Category = require('./models/Category');
const Service = require('./models/Service');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
const PricingConfig = require('./models/PricingConfig');

// Also require legacy models that might be registered in mongoose
require('./models/ServiceBrandPricing');

async function seed() {
  try {
    console.log('Connecting to database:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // 1. Create City (Indore)
    let city = await City.findOne({ slug: 'indore' });
    if (!city) {
      city = await City.create({
        name: 'Indore',
        slug: 'indore',
        state: 'Madhya Pradesh',
        country: 'India',
        isActive: true,
        isDefault: true
      });
      console.log('Created City: Indore');
    } else {
      console.log('City Indore already exists');
    }

    // 2. Create Category (Salon)
    let salonCategory = await Category.findOne({ slug: 'salon' });
    if (!salonCategory) {
      salonCategory = await Category.create({
        title: 'Salon',
        slug: 'salon',
        categoryType: 'service',
        showOnHome: true,
        hasBrands: false,
        hasSubCategory: false,
        hasBrand: false,
        cityIds: [city._id],
        status: 'active'
      });
      console.log('Created Category: Salon');
    } else {
      console.log('Category Salon already exists');
      salonCategory.cityIds = [city._id];
      await salonCategory.save();
    }

    // 3. Create Service under Salon (Mens and kids salon)
    let salonService = await Service.findOne({ slug: 'mens-and-kids-salon' });
    if (!salonService) {
      salonService = await Service.create({
        categoryId: salonCategory._id,
        title: 'Mens and kids salon',
        slug: 'mens-and-kids-salon',
        status: 'active',
        description: 'Premium grooming services for men and kids',
        cityIds: [city._id],
        serviceType: 'package_base',
        packages: [
          {
            title: 'Mens and kids salon - Harsh',
            description: 'Haircut and grooming combo',
            price: 400,
            originalPrice: 450,
            isActive: true,
            gstPercentage: 0,
            gstIncluded: true,
            platformCommission: 10,
            codEnabled: true,
            codAdvanceAmount: 40
          }
        ]
      });
      console.log('Created Service: Mens and kids salon');
    } else {
      console.log('Service Mens and kids salon already exists');
      salonService.cityIds = [city._id];
      salonService.categoryId = salonCategory._id;
      await salonService.save();
    }

    // 4. Create Pricing Config for Acceptance Fees etc.
    let pricingConfig = await PricingConfig.findOne({ serviceId: salonService._id });
    if (!pricingConfig) {
      await PricingConfig.create({
        categoryId: salonCategory._id,
        serviceId: salonService._id,
        cityId: city._id,
        customerPrice: 400,
        gstPercentage: 0,
        gstIncluded: true,
        platformCommission: 10,
        vendorAcceptanceFee: 10,
        commissionPercentage: 10
      });
      console.log('Created PricingConfig for Salon');
    }

    // 5. Create Test User (Customer)
    let testUser = await User.findOne({ phone: '9999999999' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Harsh Pandey',
        phone: '9999999999',
        role: 'user', // Match lowercase 'user'
        cityId: city._id,
        isPhoneVerified: true,
        address: {
          addressLine: 'Indore, Madhya Pradesh, India',
          lat: 22.7196,
          lng: 75.8577
        }
      });
      console.log('Created User: 9999999999');
    } else {
      console.log('User already exists');
    }

    // 6. Create Test Vendor (Professional)
    let testVendor = await Vendor.findOne({ phone: '8888888888' });
    if (!testVendor) {
      testVendor = await Vendor.create({
        name: 'Test Salon Pro',
        phone: '8888888888',
        role: 'vendor',
        cityId: city._id,
        isActive: true,
        approvalStatus: 'approved',
        service: ['salon'],
        categories: ['salon'],
        address: {
          addressLine: 'Indore, Madhya Pradesh, India',
          lat: 22.7196,
          lng: 75.8577
        },
        geoLocation: {
          type: 'Point',
          coordinates: [75.8577, 22.7196]
        }
      });
      console.log('Created Vendor: 8888888888');
    } else {
      console.log('Vendor already exists');
      testVendor.approvalStatus = 'approved';
      testVendor.isActive = true;
      testVendor.categories = ['salon'];
      testVendor.service = ['salon'];
      testVendor.geoLocation = {
        type: 'Point',
        coordinates: [75.8577, 22.7196]
      };
      await testVendor.save();
    }

    console.log('Seeding completed successfully! Please restart your servers and test.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
