const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) dotenv.config();

const { getPublicServices } = require('../controllers/publicControllers/catalogController');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log("Connected to DB");

    const req = {
      query: {
        categoryId: '6a2947ee32f15f5f65890553'
      },
      headers: {}
    };

    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        console.log("HTTP Status:", this.statusCode || 200);
        console.log("Services returned count:", data.services ? data.services.length : 0);
        if (data.services) {
          console.log(JSON.stringify(data.services, null, 2));
        }
        process.exit(0);
      }
    };

    await getPublicServices(req, res);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
