const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testJhabuaTowerPoint() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Zone = mongoose.model('Zone', new mongoose.Schema({}, { strict: false }));

  // Jhabua Tower, RNT Marg, Indore coordinates
  const lat = 22.7153, lng = 75.8700;

  const matched = await Zone.findOne({
    _id: '6a703efcdcede697235366ec',
    coordinates: {
      $geoIntersects: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      }
    }
  });
  console.log('Is Jhabua Tower inside Indore Polygon:', !!matched);
  await mongoose.disconnect();
}
testJhabuaTowerPoint().catch(console.error);
