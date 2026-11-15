const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function createIco(pngBuffers) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(pngBuffers.length, 4); // Number of images

  const entries = [];
  let currentOffset = 6 + pngBuffers.length * 16;

  for (const { buffer, size } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // Image byte size
    entry.writeUInt32LE(currentOffset, 12); // File offset
    entries.push(entry);
    currentOffset += buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map((p) => p.buffer)]);
}

async function buildAssets() {
  // 1. Full-bleed App Icon with complete logo (StayBuddy Pin + Brand Name + Hotels & Resorts)
  const svgAppIcon512 = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff7e1d"/>
      <stop offset="50%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#7c2d12" flood-opacity="0.32"/>
    </filter>
  </defs>
  
  <!-- Edge-to-edge solid brand gradient background (covers 100% of squircle canvas) -->
  <rect width="512" height="512" fill="url(#bgGrad)"/>
  
  <!-- Top ambient luxury glass sheen -->
  <path d="M0 0 L512 0 L512 210 L0 120 Z" fill="white" opacity="0.12"/>
  
  <!-- StayBuddy Mark (Scaled & Centered within Safe Zone) -->
  <g transform="translate(156, 68) scale(2.0)" filter="url(#shadow)">
    <!-- Outer Location Pin (White) -->
    <path
      d="M50 8C31.2 8 16 23.2 16 42C16 59.8 45.8 88.5 48.1 90.6C49.2 91.6 50.8 91.6 51.9 90.6C54.2 88.5 84 59.8 84 42C84 23.2 68.8 8 50 8Z"
      fill="#ffffff"
    />
    <!-- Chimney (Orange) -->
    <path
      d="M60 33V25.5C60 24.7 60.7 24 61.5 24H65.5C66.3 24 67 24.7 67 25.5V39"
      stroke="#ea580c"
      stroke-width="4.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Architectural Hotel Roof (Orange) -->
    <path
      d="M31 46.5L47.9 30.5C49.1 29.4 50.9 29.4 52.1 30.5L69 46.5"
      stroke="#ea580c"
      stroke-width="6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- House Walls & Doorway (Orange) -->
    <path
      d="M36 45V61C36 62.1 36.9 63 38 63H44.5V52.5C44.5 50.6 46.1 49 48 49H52C53.9 49 55.5 50.6 55.5 52.5V63H62C63.1 63 64 62.1 64 61V45"
      fill="#ea580c"
    />
  </g>

  <!-- Complete Brand Name: StayBuddy -->
  <text x="256" y="348" text-anchor="middle" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="56" font-weight="900" fill="#ffffff" letter-spacing="-1.5">StayBuddy</text>
  <text x="256" y="388" text-anchor="middle" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="19" font-weight="800" fill="#fed7aa" letter-spacing="4.5">HOTELS &amp; RESORTS</text>
</svg>
`;

  // 2. High-Visibility Favicon (Vector mark optimized for 48x48, 32x32, 16x16)
  const svgFavicon = `
<svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pinGrad" x1="16" y1="12" x2="84" y2="92" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fb923c" />
      <stop offset="50%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
    <filter id="fShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#7c2d12" flood-opacity="0.25"/>
    </filter>
  </defs>
  
  <g filter="url(#fShadow)">
    <!-- Outer Location Pin (Rich Orange Gradient) -->
    <path
      d="M50 6C30.5 6 15 21.5 15 41C15 59.2 45.6 88.5 48.1 90.7C49.2 91.7 50.8 91.7 51.9 90.7C54.4 88.5 85 59.2 85 41C85 21.5 69.5 6 50 6Z"
      fill="url(#pinGrad)"
    />
    <!-- Chimney -->
    <path
      d="M60 32V24.5C60 23.7 60.7 23 61.5 23H65.5C66.3 23 67 23.7 67 24.5V38"
      stroke="#ffffff"
      stroke-width="5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Architectural Hotel Roof -->
    <path
      d="M30 46L47.9 29.5C49.1 28.4 50.9 28.4 52.1 29.5L70 46"
      stroke="#ffffff"
      stroke-width="7"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- House Walls & Welcoming Gateway -->
    <path
      d="M35 44V61C35 62.1 35.9 63 37 63H44V52.5C44 50.6 45.6 49 47.5 49H52.5C54.4 49 56 50.6 56 52.5V63H63C64.1 63 65 62.1 65 61V44"
      fill="#ffffff"
    />
  </g>
</svg>
`;

  console.log('Rendering 512x512 app icon...');
  const app512Buf = await sharp(Buffer.from(svgAppIcon512)).png().toBuffer();
  fs.writeFileSync(path.join(__dirname, 'public/icon-512.png'), app512Buf);

  console.log('Rendering 192x192 app icon...');
  const app192Buf = await sharp(app512Buf).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(__dirname, 'public/icon-192.png'), app192Buf);
  fs.writeFileSync(path.join(__dirname, 'public/icon.png'), app192Buf);
  fs.writeFileSync(path.join(__dirname, 'app/icon.png'), app192Buf);

  console.log('Rendering 180x180 apple touch icon...');
  const app180Buf = await sharp(app512Buf).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(__dirname, 'public/apple-icon.png'), app180Buf);
  fs.writeFileSync(path.join(__dirname, 'public/apple-touch-icon.png'), app180Buf);
  fs.writeFileSync(path.join(__dirname, 'app/apple-icon.png'), app180Buf);

  console.log('Rendering 96x96 and 48x48 icons...');
  const app96Buf = await sharp(app512Buf).resize(96, 96).png().toBuffer();
  fs.writeFileSync(path.join(__dirname, 'public/icon-96.png'), app96Buf);

  // Favicon PNGs
  const fav48Buf = await sharp(Buffer.from(svgFavicon)).resize(48, 48).png().toBuffer();
  const fav32Buf = await sharp(Buffer.from(svgFavicon)).resize(32, 32).png().toBuffer();
  const fav16Buf = await sharp(Buffer.from(svgFavicon)).resize(16, 16).png().toBuffer();

  fs.writeFileSync(path.join(__dirname, 'public/favicon-48x48.png'), fav48Buf);
  fs.writeFileSync(path.join(__dirname, 'public/icon-48.png'), fav48Buf);

  console.log('Packaging multi-resolution favicon.ico (48, 32, 16)...');
  const icoBuf = createIco([
    { buffer: fav48Buf, size: 48 },
    { buffer: fav32Buf, size: 32 },
    { buffer: fav16Buf, size: 16 },
  ]);

  fs.writeFileSync(path.join(__dirname, 'public/favicon.ico'), icoBuf);
  fs.writeFileSync(path.join(__dirname, 'app/favicon.ico'), icoBuf);

  console.log('All brand assets successfully built and packaged!');
}

buildAssets().catch(console.error);

