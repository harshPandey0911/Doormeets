const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const Vendor = require('../models/Vendor');

async function run() {
  await mongoose.connect(mongoUri);
  console.log('Connected to DB');

  try {
    const vendorId = '6a13fdd2381a994f1815879a';
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      console.log('Vendor not found');
      return;
    }

    // Exact fields sent by EditProfile.jsx
    const reqBody = {
      name: 'harsh pandey',
      businessName: '',
      address: {
        fullAddress: "169, 507, Corporate House, RNT Marg, Near Central Mall, Flim Colony, South Tukoganj, Indore, Madhya Pradesh 452001, India",
        addressLine1: "",
        addressLine2: "South Tukoganj",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452001",
        landmark: "",
        lat: 22.717600398934533,
        lng: 75.87196932164258
      },
      serviceCategory: ['Beauty Packages', 'plant'],
      profilePhoto: '',
      aadharDocument: 'https://res.cloudinary.com/deorxby43/image/upload/v1779695058/vendors/documents/jenam0ubwilxc196j8xc.webp',
      serviceRange: 12
    };

    const { name, businessName, address, profilePhoto, serviceCategory, serviceRange } = reqBody;

    // Apply edits exactly as done in vendorProfileController.js updateProfile
    if (name) vendor.name = name.trim();
    if (businessName !== undefined) vendor.businessName = businessName ? businessName.trim() : null;
    
    if (address) {
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

      if (vendor.address.lat && vendor.address.lng) {
        vendor.geoLocation = {
          type: 'Point',
          coordinates: [vendor.address.lng, vendor.address.lat]
        };
      }
    }

    if (profilePhoto !== undefined) {
      vendor.profilePhoto = profilePhoto;
    }

    if (serviceCategory !== undefined) {
      if (Array.isArray(serviceCategory)) {
        vendor.service = serviceCategory;
        vendor.categories = serviceCategory;
      }
    }

    if (serviceRange !== undefined) {
      if (!vendor.settings) vendor.settings = {};
      vendor.settings.serviceRange = Number(serviceRange) || 10;
    }

    console.log('Attempting to save vendor...');
    await vendor.save();
    console.log('✅ Vendor saved successfully!');

  } catch (error) {
    console.error('CRITICAL ERROR DURING VENDOR UPDATE:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
