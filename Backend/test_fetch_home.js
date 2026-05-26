require('dotenv').config();
const mongoose = require('mongoose');
const { getPublicHomeData } = require('./controllers/publicControllers/catalogController');

async function testFetch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

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
        console.log('HTTP Status:', this.statusCode || 200);
        console.log('Categories returned:', data.categories.map(c => ({ id: c.id, title: c.title, status: c.status, showOnHome: c.showOnHome })));
        process.exit(0);
      }
    };

    await getPublicHomeData(req, res);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

testFetch();
