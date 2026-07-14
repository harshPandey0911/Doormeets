const fs = require('fs');
const code = fs.readFileSync('c:/Users/DELL/Desktop/Door__meets/Doormeets/Backend/server.js', 'utf8');

const lines = code.split('\n');
for (let i = 280; i < 326; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
