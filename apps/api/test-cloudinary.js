import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary — fill in YOUR_API_SECRET before running
cloudinary.config({
  cloud_name: 'djk7hpyku',
  api_key: '575918135533359',
  api_secret: 'YOUR_API_SECRET' // ← replace this
});

async function testCloudinaryIntegration() {
  try {
    console.log('Starting Cloudinary integration test...\n');

    // Step 1: Upload an image from Cloudinary's demo domain
    console.log('1. Uploading image...');
    const uploadResult = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      {
        public_id: 'comfytag-test-image',
        resource_type: 'auto'
      }
    );

    const secureUrl = uploadResult.secure_url;
    const publicId = uploadResult.public_id;
    console.log(`   ✓ Image uploaded`);
    console.log(`   Public ID: ${publicId}`);
    console.log(`   Secure URL: ${secureUrl}\n`);

    // Step 2: Fetch image metadata
    console.log('2. Fetching image metadata...');
    const resource = await cloudinary.api.resource(publicId);

    console.log(`   ✓ Metadata retrieved`);
    console.log(`   Width: ${resource.width}px`);
    console.log(`   Height: ${resource.height}px`);
    console.log(`   Format: ${resource.format}`);
    console.log(`   Size: ${resource.bytes} bytes\n`);

    // Step 3: Generate transformed URL with optimization
    console.log('3. Generating optimized image URL...');
    // f_auto = automatic format selection (WebP for modern browsers, JPEG fallback)
    // q_auto = automatic quality optimization based on browser/device
    const transformedUrl = cloudinary.url(publicId, {
      transformation: [
        { fetch_format: 'auto', quality: 'auto' }
      ],
      secure: true
    });

    console.log(`   ✓ Transformation applied`);
    console.log(`   f_auto: Automatically selects the best format (WebP, AVIF, or JPEG)`);
    console.log(`   q_auto: Automatically optimizes quality for the requesting device\n`);

    console.log('═══════════════════════════════════════════════════');
    console.log('✓ Done! Cloudinary integration is working correctly.');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('Original image:');
    console.log(secureUrl);
    console.log('\nOptimized image (open this link to see):');
    console.log(transformedUrl);
    console.log('\nCompare the file sizes and formats when you open both.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testCloudinaryIntegration();
