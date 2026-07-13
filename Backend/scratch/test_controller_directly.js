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

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const Service = require('../models/Service');
  const serviceController = require('../controllers/adminControllers/serviceController');
  
  const existingService = await Service.findOne();
  if (!existingService) {
    console.log("No service found in database.");
    process.exit(0);
  }
  
  console.log("Testing controller update for service:", existingService.title, "ID:", existingService._id);
  
  // Mock req and res
  const req = {
    params: { id: existingService._id.toString() },
    body: {
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
    }
  };
  
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log("Response Status:", this.statusCode || 200);
      console.log("Response Data:", JSON.stringify(data, null, 2));
    }
  };
  
  try {
    await serviceController.updateService(req, res);
  } catch (err) {
    console.error("Direct controller invocation error:", err);
  }
  process.exit(0);
}

run();
