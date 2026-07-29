const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority');
    console.log(`Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const runTest = async () => {
  await connectDB();

  const Zone = require('../models/Zone');
  const { findZoneByLocation, findNearestZone } = require('../services/zoneService');

  // Let's create a test zone around Indore central area
  // Polygon Coordinates: [[[lng, lat], ...]] (closed loop)
  const testZoneName = "Test Zone Indore Centroid";
  
  // Clean up any existing test zone
  await Zone.deleteOne({ name: testZoneName });

  const indoreCentralPolygon = [
    [
      [75.845, 22.705],
      [75.875, 22.705],
      [75.875, 22.735],
      [75.845, 22.735],
      [75.845, 22.705] // Closed loop
    ]
  ];

  console.log('Creating test zone...');
  const zone = await Zone.create({
    name: testZoneName,
    coordinates: {
      type: 'Polygon',
      coordinates: indoreCentralPolygon
    },
    isActive: true
  });
  console.log('Zone created successfully:', zone.name);

  // Test 1: Coordinate INSIDE the zone polygon
  // (75.860, 22.720) is inside [75.845, 22.705] to [75.875, 22.735]
  console.log('\n--- Testing Location Inside Zone ---');
  const insideMatch = await findZoneByLocation(22.720, 75.860);
  console.log('Location: (22.720, 75.860)');
  console.log('Found Zone:', insideMatch ? insideMatch.name : 'None (Outside)');

  // Test 2: Coordinate OUTSIDE the zone polygon
  // (22.760, 75.890) is outside the polygon
  console.log('\n--- Testing Location Outside Zone ---');
  const outsideMatch = await findZoneByLocation(22.760, 75.890);
  console.log('Location: (22.760, 75.890)');
  console.log('Found Zone:', outsideMatch ? outsideMatch.name : 'None (Outside)');

  // Test 3: Calculate Nearest Zone
  console.log('\n--- Testing Nearest Zone Fallback ---');
  const nearest = await findNearestZone(22.760, 75.890);
  console.log('Nearest Zone Name:', nearest ? nearest.name : 'None');
  console.log('Distance in Km:', nearest ? nearest.distanceKm : 'N/A');

  // Clean up
  console.log('\nCleaning up test zone...');
  await Zone.deleteOne({ _id: zone._id });
  console.log('Cleanup finished.');

  process.exit(0);
};

runTest();
