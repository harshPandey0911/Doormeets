const fs = require('fs');
const content = fs.readFileSync('c:/Users/DELL/Desktop/Door__meets/Doormeets/Backend/controllers/publicControllers/catalogController.js', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('getPublicServiceDynamicDetails')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
