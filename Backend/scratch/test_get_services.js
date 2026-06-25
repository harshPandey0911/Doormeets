const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) dotenv.config();

const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const { getAllServices } = require('../controllers/adminControllers/serviceController');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log("Connected to DB");

    const req = {
      query: {},
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
        const allServices = data.services.find(s => s.title === 'All Services');
        console.log(JSON.stringify(allServices, null, 2));
        process.exit(0);
      }
    };

    await getAllServices(req, res);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
