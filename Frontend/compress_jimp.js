import { execSync } from 'child_process';
import path from 'path';

console.log("Installing jimp dynamically (without saving to package.json)...");
execSync("npm install jimp --no-save", { stdio: 'inherit' });

const JimpModule = await import('jimp');
const Jimp = JimpModule.default || JimpModule.Jimp || JimpModule;

const imgDir = path.join('src', 'assets', 'images', 'pages');

async function compress() {
  const p1 = path.join(imgDir, 'welcomePage.png');
  const j1 = path.join(imgDir, 'welcomePage.jpg');
  const p2 = path.join(imgDir, 'welcomePage2.png');
  const j2 = path.join(imgDir, 'welcomePage2.jpg');

  console.log(`Loading ${p1}...`);
  const image1 = await Jimp.read(p1);
  console.log(`Writing JPG to ${j1}...`);
  await image1.quality(75).write(j1);

  console.log(`Loading ${p2}...`);
  const image2 = await Jimp.read(p2);
  console.log(`Writing JPG to ${j2}...`);
  await image2.quality(75).write(j2);

  console.log("Compression to JPG complete!");
}

compress().catch(console.error);
