const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\DELL\\Desktop\\Door__meets\\Doormeets\\Frontend\\src\\modules\\admin\\pages\\ServiceBased\\index.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('Matrix') || line.includes('matrix')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
