const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'controllers', 'bookingControllers', 'vendorBookingController.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all 'await createNotification(' with 'createNotification('
const newContent = content.replace(/await createNotification\(/g, 'createNotification(');

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully replaced await createNotification with createNotification!');
