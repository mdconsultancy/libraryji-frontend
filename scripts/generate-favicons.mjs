// One-off script: regenerates every favicon/app-icon asset from the brand
// icon mark (public/images/logos/icon-mark.png — the LJ book glyph cropped
// out of the full logo, see icon-mark.png's own history) so the tab icon,
// Google search-result icon, Apple touch icon, and Android/PWA icons are all
// a crisp, recognizable mark instead of the full logo.jpeg (which also has
// the "LibraryJi / Smart Library Management System" wordmark baked in —
// fine at full size, but squeezed into a 16x16 tab icon it's just an
// unreadable blur, which is why the favicon looked "broken"). The full logo
// is still used for the OG/share image below, where the text is legible.
// Run with `node scripts/generate-favicons.mjs` whenever the logo changes.
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const iconSource = join(publicDir, "images", "logos", "icon-mark.png");
const fullLogoSource = join(publicDir, "images", "logos", "logo.jpeg");

const targets = [
  { file: "favicon.png", size: 48 },
  { file: "favicon-16x16.png", size: 16 },
  { file: "favicon-32x32.png", size: 32 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "android-chrome-192x192.png", size: 192 },
  { file: "android-chrome-512x512.png", size: 512 },
];

/** Minimal "PNG-in-ICO" encoder — the ICO format Windows Vista+ and every
 *  modern browser accepts, embedding a real PNG instead of raw bitmap data.
 *  Avoids pulling in a whole extra npm dependency just to produce one file. */
function pngToIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // image data size
  entry.writeUInt32LE(header.length + entry.length, 12); // offset

  return Buffer.concat([header, entry, pngBuffer]);
}

async function main() {
  for (const { file, size } of targets) {
    const buf = await sharp(iconSource)
      .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();
    writeFileSync(join(publicDir, file), buf);
    console.log(`wrote ${file} (${size}x${size})`);
  }

  // favicon.ico — the one path browsers/crawlers still probe by convention
  // even when a page's <link rel="icon"> points elsewhere.
  const icoPng = await sharp(iconSource)
    .resize(48, 48, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();
  writeFileSync(join(publicDir, "favicon.ico"), pngToIco(icoPng, 48));
  console.log("wrote favicon.ico (48x48)");

  // Open Graph / Twitter share image — full logo (with wordmark) centered on
  // a white 1200x630 canvas (the standard OG size), so links shared in
  // WhatsApp/Slack/X/Facebook show the full brand, text and all, legible at
  // that much larger size.
  const ogLogo = await sharp(fullLogoSource).resize(500, 500, { fit: "contain" }).toBuffer();
  const og = await sharp({
    create: { width: 1200, height: 630, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: ogLogo, gravity: "center" }])
    .png()
    .toBuffer();
  writeFileSync(join(publicDir, "images", "og-image.png"), og);
  console.log("wrote images/og-image.png (1200x630)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
