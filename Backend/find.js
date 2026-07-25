const fs = require('fs');

const content = fs.readFileSync('c:\\Users\\DELL\\Desktop\\Door__meets\\Doormeets\\Backend\\controllers\\bookingControllers\\cashCollectionController.js', 'utf8');

const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('processBookingCompletion') || line.includes('wallet.credits')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
