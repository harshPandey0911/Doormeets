const fs = require('fs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const Admin = require('../models/Admin');
  const Service = require('../models/Service');
  
  // Generate admin token
  const token = jwt.sign(
    { userId: "6a100e040d12994acd435588", role: 'admin' },
    env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  );
  
  const axios = require('axios');
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const existingService = await Service.findOne();
  if (!existingService) {
    console.log("No service found in DB");
    process.exit(0);
  }
  
  console.log("Attempting API PUT request for service:", existingService.title);
  try {
    const res = await axiosInstance.put(`/admin/services/${existingService._id}`, {
      title: existingService.title,
      categoryId: existingService.categoryId ? existingService.categoryId.toString() : null,
      serviceType: "package_base",
      variants: [
        {
          title: "Latch repair/install",
          extraPrice: 99,
          platformCommission: 20,
          l1Commission: 10,
          l2Commission: 15,
          l3Commission: 20
        }
      ]
    });
    console.log("API PUT Success:", res.data);
  } catch (error) {
    console.error("API PUT Failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error message:", error.message);
      console.error(error);
    }
  }
  
  process.exit(0);
}

run();
