#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */
/**
 * PWA Icon Generator Script
 *
 * This script creates placeholder SVG icons for the PWA.
 * In production, replace these with actual branded icons.
 *
 * Run: node scripts/generate-icons.js
 *
 * For production, use a tool like sharp or imagemagick to convert
 * the source logo to all required sizes:
 *
 * npx sharp-cli -i images/logo.png -o public/icons/icon-72x72.png resize 72 72
 * npx sharp-cli -i images/logo.png -o public/icons/icon-96x96.png resize 96 96
 * etc.
 */

const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const createSvgIcon = (size) => {
  // Create a simple "M" logo placeholder for Metabolikal
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <text x="50%" y="55%" fill="#ffffff" font-family="Arial, sans-serif" font-size="${Math.floor(size * 0.5)}" font-weight="bold" text-anchor="middle" dominant-baseline="middle">M</text>
</svg>`;
};

const iconsDir = path.join(__dirname, "..", "public", "icons");

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG placeholders for each size
sizes.forEach((size) => {
  const svg = createSvgIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Created ${filename}`);
});

console.log("\\nPlaceholder icons created.");
console.log("\\nIMPORTANT: For production, convert these to PNG or replace with branded icons.");
console.log("You can use tools like sharp, imagemagick, or online converters.");
console.log("\\nExample with sharp:");
console.log("  npx sharp-cli -i images/logo.png -o public/icons/icon-192x192.png resize 192 192");
