import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from apps/api/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CORRUPTED_PATTERN = /â€"/g; // UTF-8 encoding error for em-dash

async function inspectAndClean() {
  try {
    // Debug: Show environment loaded
    const envPath = path.resolve(__dirname, '../.env');
    console.log(`📂 Loading .env from: ${envPath}`);
    console.log(`📊 MONGO: ${process.env.MONGO ? '***[loaded]' : '***[not found, using default]'}\n`);

    // Connect to MongoDB
    const mongoUri = process.env.MONGO || 'mongodb://localhost:27017/comfytag';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Find all users with corrupted data in phone or avatar fields
    const corruptedUsers = await User.find({
      $or: [
        { phone: { $regex: 'â€"' } },
        { avatar: { $regex: 'â€"' } }
      ]
    });

    if (corruptedUsers.length === 0) {
      console.log('✓ No corrupted data found in phone or avatar fields');
      await mongoose.connection.close();
      return;
    }

    console.log(`\n⚠ Found ${corruptedUsers.length} user(s) with corrupted data:\n`);

    // Report corrupted records
    for (const user of corruptedUsers) {
      console.log(`  User: ${user.name} (${user.email})`);
      if (user.phone?.includes('â€"')) {
        console.log(`    - phone: "${user.phone}"`);
      }
      if (user.avatar?.includes('â€"')) {
        console.log(`    - avatar: "${user.avatar}"`);
      }
    }

    // Clean corrupted data
    console.log(`\n🔧 Cleaning corrupted data...\n`);

    const result = await User.updateMany(
      {
        $or: [
          { phone: { $regex: 'â€"' } },
          { avatar: { $regex: 'â€"' } }
        ]
      },
      {
        $set: {
          phone: '',
          avatar: null
        }
      }
    );

    console.log(`✓ Cleaned ${result.modifiedCount} user record(s)`);
    console.log(`  - Set phone to empty string`);
    console.log(`  - Set avatar to null`);

    // Verify cleanup
    const verifyCorrupted = await User.find({
      $or: [
        { phone: { $regex: 'â€"' } },
        { avatar: { $regex: 'â€"' } }
      ]
    });

    if (verifyCorrupted.length === 0) {
      console.log('\n✓ Verification: All corrupted data has been removed');
    } else {
      console.log(`\n⚠ Warning: ${verifyCorrupted.length} record(s) still contain corrupted data`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

inspectAndClean();
