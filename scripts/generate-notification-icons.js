import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function generateIcons() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const svgContent = `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: block;">
      <path
        d="M8 6C8 4.89543 8.89543 4 10 4H24C25.1046 4 26 4.89543 26 6C26 7.10457 25.1046 8 24 8H13V14H22C23.1046 14 24 14.8954 24 16C24 17.1046 23.1046 18 22 18H13V26C13 27.1046 12.1046 28 11 28C9.89543 28 8 26.8954 8 25.7909V6Z"
        fill="#FFFFFF"
      />
      <circle cx="22.5" cy="23.5" r="3.5" fill="#FFFFFF" />
    </svg>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: transparent;
            width: 100%;
            height: 100%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await page.setContent(html);

  const densities = [
    { dir: 'drawable-mdpi', size: 24 },
    { dir: 'drawable-hdpi', size: 36 },
    { dir: 'drawable-xhdpi', size: 48 },
    { dir: 'drawable-xxhdpi', size: 72 },
    { dir: 'drawable-xxxhdpi', size: 96 },
  ];

  for (const d of densities) {
    await page.setViewport({ width: d.size, height: d.size, deviceScaleFactor: 1 });
    const targetDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', d.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetFile = path.join(targetDir, 'ic_stat_finly_notification.png');
    await page.screenshot({ path: targetFile, omitBackground: true });
    console.log(`Generated: ${targetFile} (${d.size}x${d.size})`);

    // Also save ic_stat_finly.png as alias
    const aliasFile = path.join(targetDir, 'ic_stat_finly.png');
    fs.copyFileSync(targetFile, aliasFile);
  }

  await browser.close();
  console.log('All Android notification icon densities generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
