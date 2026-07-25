const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGODB_URI);
  const TrainingVideo = require('./models/TrainingVideo');
  
  const videos = await TrainingVideo.find({});
  console.log('Training Videos:', JSON.stringify(videos, null, 2));

  process.exit(0);
}

check();
