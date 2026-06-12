/**
 * Migration Script: Clean Corrupted UTF-8 Sequences in User Fields
 *
 * This script finds all User documents with corrupted em-dash and other
 * UTF-8 sequences in the 'phone' and 'avatar' fields, and removes them.
 *
 * Run with: node apps/api/scripts/cleanCorruptedUserFields.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Users from '../models/User.js';

dotenv.config();

const cleanDatabase = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/comfytag';
        await mongoose.connect(mongoUrl);
        console.log('✅ Connected to MongoDB');

        // Pattern to match corrupted UTF-8 sequences
        const corruptedPattern = /â€"|â€™|â€˜|â€œ|â€|â„¹|â‚¦|Â·|â‰¥|â"€/g;

        console.log('\n📋 Scanning for corrupted phone fields...');
        const phoneResults = await Users.updateMany(
            { phone: corruptedPattern },
            { $set: { phone: '' } }
        );
        console.log(`✅ Fixed ${phoneResults.modifiedCount} documents with corrupted phone field`);

        console.log('\n📋 Scanning for corrupted avatar fields...');
        const avatarResults = await Users.updateMany(
            { avatar: corruptedPattern },
            { $set: { avatar: null } }
        );
        console.log(`✅ Fixed ${avatarResults.modifiedCount} documents with corrupted avatar field`);

        // Also check for exact string matches if they got stored differently
        console.log('\n📋 Checking for exact corrupted string matches...');
        const phoneExactResults = await Users.updateMany(
            { phone: { $in: ['â€"', '—', 'â„¹ï¸', 'â„¹', 'â‚¦', 'Â·', 'â‰¥'] } },
            { $set: { phone: '' } }
        );
        console.log(`✅ Fixed ${phoneExactResults.modifiedCount} documents with exact corrupted phone strings`);

        const avatarExactResults = await Users.updateMany(
            { avatar: { $in: ['â€"', '—', 'â„¹ï¸', 'â„¹', 'â‚¦', 'Â·', 'â‰¥'] } },
            { $set: { avatar: null } }
        );
        console.log(`✅ Fixed ${avatarExactResults.modifiedCount} documents with exact corrupted avatar strings`);

        // Verify the fix by sampling a few users
        console.log('\n🔍 Verification: Sampling cleaned data...');
        const sample = await Users.find(
            { $or: [{ phone: { $exists: true, $ne: '' } }, { avatar: { $exists: true, $ne: null } }] }
        ).limit(3).select('_id name email phone avatar');

        if (sample.length > 0) {
            console.log('\nSample of cleaned users:');
            sample.forEach(user => {
                console.log(`  - ${user.name} (${user.email})`);
                console.log(`    Phone: "${user.phone || '(empty)'}"`);
                console.log(`    Avatar: "${user.avatar || '(null)'}"`);
            });
        } else {
            console.log('No users with phone/avatar data found (all cleaned or empty)');
        }

        // Get total stats
        const totalUsers = await Users.countDocuments();
        const usersWithPhone = await Users.countDocuments({ phone: { $exists: true, $ne: '' } });
        const usersWithAvatar = await Users.countDocuments({ avatar: { $exists: true, $ne: null } });

        console.log('\n📊 Final Statistics:');
        console.log(`  Total users: ${totalUsers}`);
        console.log(`  Users with phone: ${usersWithPhone}`);
        console.log(`  Users with avatar: ${usersWithAvatar}`);

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
};

cleanDatabase();
