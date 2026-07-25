const fs = require('fs');

const content = fs.readFileSync('c:\\Users\\DELL\\Desktop\\Door__meets\\Doormeets\\Frontend\\src\\modules\\user\\pages\\PremiumCategoryPage\\index.jsx', 'utf8');

const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('ServiceCard') && line.includes('import')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
