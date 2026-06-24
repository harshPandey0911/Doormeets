const fs = require('fs');
const mongoose = require('mongoose');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  const Service = require('../models/Service');
  
  const packages = [
    {
      title: "Monthly Plan",
      description: "Basic monthly subscription for recurring bathroom cleaning needs",
      price: 999,
      originalPrice: 1499,
      duration: "30 Days",
      isPopular: false,
      isActive: true,
      visitsCredits: 4,
      bookingDiscount: 10,
      freeInspection: true,
      prioritySupport: true,
      memberPricing: false
    },
    {
      title: "Quarterly Plan",
      description: "Best value subscription for seasonal deep cleaning and maintenance",
      price: 2499,
      originalPrice: 3999,
      duration: "90 Days",
      isPopular: true,
      isActive: true,
      visitsCredits: 12,
      bookingDiscount: 15,
      freeInspection: true,
      prioritySupport: true,
      memberPricing: true
    },
    {
      title: "Yearly Plan",
      description: "Premium annual protection package with maximum benefits",
      price: 7999,
      originalPrice: 11999,
      duration: "365 Days",
      isPopular: false,
      isActive: true,
      visitsCredits: 50,
      bookingDiscount: 20,
      freeInspection: true,
      prioritySupport: true,
      memberPricing: true
    }
  ];

  const updatedService = await Service.findByIdAndUpdate(
    '6a3b9fc81249673a6955dec8',
    { $set: { packages } },
    { new: true }
  );

  console.log('Seeded packages successfully:', JSON.stringify(updatedService.packages, null, 2));
  process.exit(0);
}

seed();
