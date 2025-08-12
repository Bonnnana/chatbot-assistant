const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIOLogo(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Clear canvas with black background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, size, size);

  // Set text properties
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(size * 0.4)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Add subtle blue glow effect
  ctx.shadowColor = '#4A90E2';
  ctx.shadowBlur = Math.floor(size * 0.1);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw text with glow
  ctx.fillText('IO', size / 2, size / 2);

  // Reset shadow and draw clean text on top
  ctx.shadowBlur = 0;
  ctx.fillText('IO', size / 2, size / 2);

  return canvas;
}

// Generate 128x128 icon
const canvas128 = generateIOLogo(128);
const buffer128 = canvas128.toBuffer('image/png');
fs.writeFileSync('icon-128.png', buffer128);
console.log('Generated icon-128.png');

// Generate 32x32 icon
const canvas32 = generateIOLogo(32);
const buffer32 = canvas32.toBuffer('image/png');
fs.writeFileSync('icon-32.png', buffer32);
console.log('Generated icon-32.png');

console.log('All icons generated successfully!');
