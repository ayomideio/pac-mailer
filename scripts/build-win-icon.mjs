import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import pngToIco from 'png-to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pngPath = path.join(root, 'icon.png');
const buildDir = path.join(root, 'build');
const squarePath = path.join(buildDir, 'icon-square.png');
const icoPath = path.join(buildDir, 'icon.ico');

if (!fs.existsSync(pngPath)) {
  console.error('icon.png not found at project root');
  process.exit(1);
}

fs.mkdirSync(buildDir, { recursive: true });

const width = Number(
  execSync(`sips -g pixelWidth "${pngPath}"`, { encoding: 'utf8' })
    .match(/pixelWidth: (\d+)/)?.[1]
);
const height = Number(
  execSync(`sips -g pixelHeight "${pngPath}"`, { encoding: 'utf8' })
    .match(/pixelHeight: (\d+)/)?.[1]
);
const crop = Math.min(width, height);

fs.copyFileSync(pngPath, squarePath);
execSync(`sips -c ${crop} ${crop} "${squarePath}"`, { stdio: 'inherit' });
execSync(`sips -z 256 256 "${squarePath}"`, { stdio: 'inherit' });

const buf = await pngToIco(squarePath);
fs.writeFileSync(icoPath, buf);
console.log('Created build/icon.ico for Windows installer');
