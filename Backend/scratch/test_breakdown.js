const fs = require('fs');
const code = fs.readFileSync('c:/Users/DELL/Desktop/Door__meets/Doormeets/Backend/controllers/publicControllers/catalogController.js', 'utf8');

const lines = code.split('\n');
for (let i = 1030; i < 1055; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
