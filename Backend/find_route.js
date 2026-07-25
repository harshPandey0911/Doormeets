const fs = require('fs');
const path = require('path');

const routesDir = 'c:\\Users\\DELL\\Desktop\\Door__meets\\Doormeets\\Backend\\routes';
const files = fs.readdirSync(routesDir);

files.forEach(file => {
  const filepath = path.join(routesDir, file);
  if (fs.statSync(filepath).isFile()) {
    const content = fs.readFileSync(filepath, 'utf8');
    content.split('\n').forEach((line, i) => {
      if (line.toLowerCase().includes('accept')) {
        console.log(`${file}:${i + 1} ${line.trim()}`);
      }
    });
  }
});
