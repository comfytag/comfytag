#!/usr/bin/env node

/**
 * Logo Asset Generator
 * Converts SVG logo to multiple PNG sizes and formats needed across all apps
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed, if not provide instructions
try {
  require.resolve('sharp');
} catch (e) {
  console.log('sharp package not found. Install with: npm install sharp');
  process.exit(1);
}

const sharp = require('sharp');

const SOURCE_SVG = path.join(__dirname, '../apps/web/public/logo.png');
const APPS = ['web', 'partner', 'admin'];

const SIZES = [
  { name: 'favicon', size: 32, output: 'favicon.png' },
  { name: 'logo-small', size: 192, output: 'logo192.png' },
  { name: 'logo-medium', size: 256, output: 'logo.png' },
  { name: 'logo-large', size: 512, output: 'logo512.png' },
  { name: 'apple-touch-icon', size: 180, output: 'apple-touch-icon.png' },
];

async function generateAssets() {
  console.log('🎨 Generating logo assets from SVG...\n');

  // Generate PNG versions
  for (const size of SIZES) {
    console.log(`  Generating ${size.name} (${size.size}x${size.size})...`);

    try {
      // Read SVG
      const svgBuffer = fs.readFileSync(SOURCE_SVG);

      // Convert to PNG
      const pngBuffer = await sharp(svgBuffer)
        .resize(size.size, size.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer();

      // Save to each app's public directory
      for (const app of APPS) {
        const outputDir = path.join(__dirname, `../apps/${app}/public`);

        // Create directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, size.output);
        fs.writeFileSync(outputPath, pngBuffer);
        console.log(`    ✓ ${app}/public/${size.output}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to generate ${size.name}:`, error.message);
      process.exit(1);
    }
  }

  // Copy SVG to all apps
  console.log(`\n  Copying SVG to all apps...`);
  for (const app of APPS) {
    const outputDir = path.join(__dirname, `../apps/${app}/public`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, 'logo.png');
    fs.copyFileSync(SOURCE_SVG, outputPath);
    console.log(`    ✓ ${app}/public/logo.png`);
  }

  // Mobile app assets
  console.log(`\n  Setting up mobile app assets...`);
  const mobileDir = path.join(__dirname, '../apps/mobile/assets');
  if (!fs.existsSync(mobileDir)) {
    fs.mkdirSync(mobileDir, { recursive: true });
  }

  // Generate 192x192 for mobile icon
  try {
    const svgBuffer = fs.readFileSync(SOURCE_SVG);
    const pngBuffer = await sharp(svgBuffer)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(mobileDir, 'icon.png'), pngBuffer);
    console.log(`    ✓ mobile/assets/icon.png (192x192)`);
  } catch (error) {
    console.error(`  ✗ Failed to generate mobile icon:`, error.message);
  }

  console.log('\n✅ Logo assets generated successfully!\n');
  console.log('Generated files:');
  console.log('  - favicon.png (32x32)');
  console.log('  - logo192.png (192x192)');
  console.log('  - logo.png (256x256)');
  console.log('  - logo512.png (512x512)');
  console.log('  - apple-touch-icon.png (180x180)');
  console.log('  - logo.png (scalable)');
  console.log('\nLocations:');
  console.log('  - apps/web/public/');
  console.log('  - apps/partner/public/');
  console.log('  - apps/admin/public/');
  console.log('  - apps/mobile/assets/');
}

generateAssets().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
