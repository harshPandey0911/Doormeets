require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const TrainingVideo = require('../models/TrainingVideo');
const TrainingQuestion = require('../models/TrainingQuestion');

const clearData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civilconnect', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected.');

    console.log('Clearing Training Videos...');
    await TrainingVideo.deleteMany({});
    
    console.log('Clearing Training Questions...');
    await TrainingQuestion.deleteMany({});

    console.log('Dummy data cleared successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
};

clearData();
