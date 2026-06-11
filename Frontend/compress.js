import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log("Installing sharp dynamically (without saving to package.json)...");
execSync("npm install sharp --no-save", { stdio: 'inherit' });

// Dynamic import of sharp since it's installed at runtime
const { default: sharp } = await import('sharp');

const imgDir = path.join('src', 'assets', 'images', 'pages');

async function compress() {
  const p1 = path.join(imgDir, 'welcomePage.png');
  const w1 = path.join(imgDir, 'welcomePage.webp');
  const p2 = path.join(imgDir, 'welcomePage2.png');
  const w2 = path.join(imgDir, 'welcomePage2.webp');

  console.log(`Compressing ${p1} -> ${w1}...`);
  await sharp(p1)
    .webp({ quality: 80 })
    .toFile(w1);

  console.log(`Compressing ${p2} -> ${w2}...`);
  await sharp(p2)
    .webp({ quality: 80 })
    .toFile(w2);

  console.log("Compression complete!");
}

compress().catch(console.error);
