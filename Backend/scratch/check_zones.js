const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const run = async () => {
  await mongoose.connect('mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority');
  console.log('Connected');

  const Zone = require('../models/Zone');
  const zones = await Zone.find({});
  console.log('Total zones:', zones.length);
  for (const zone of zones) {
    console.log(`Name: ${zone.name}, Active: ${zone.isActive}`);
    console.log('Coordinates:', JSON.stringify(zone.coordinates));
  }
  process.exit(0);
};

run();
