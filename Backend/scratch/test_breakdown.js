const fs = require('fs');
const code = fs.readFileSync('c:/Users/DELL/Desktop/Door__meets/Doormeets/Frontend/src/modules/admin/pages/UserCategories/pages/ServicesPage.jsx', 'utf8');

const lines = code.split('\n');
for (let i = 1180; i < 1235; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
