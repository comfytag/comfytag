/**
 * Inspection Script: Find Corrupted UTF-8 Sequences in User Fields
 *
 * This is a READ-ONLY script that finds all User documents with corrupted
 * em-dash and other UTF-8 sequences in the 'phone' and 'avatar' fields.
 * No data is modified.
 *
 * Run with: node apps/api/scripts/inspectCorruptedUserFields.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Users from '../models/User.js';

dotenv.config();

const inspectDatabase = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/comfytag';
        await mongoose.connect(mongoUrl);
        console.log('✅ Connected to MongoDB');

        console.log('\n🔍 Scanning for corrupted phone fields...');
        const phoneCorrupted = await Users.find(
            { phone: { $regex: 'â€"|â€™|â€˜|â€œ|â€|â„¹|â‚¦|Â·|â‰¥|â"€' } }
        ).select('_id name email phone');

        if (phoneCorrupted.length > 0) {
            console.log(`⚠️  Found ${phoneCorrupted.length} corrupted phone field(s):`);
            phoneCorrupted.forEach((user, idx) => {
                console.log(`\n  ${idx + 1}. ${user.name} (${user.email})`);
                console.log(`     User ID: ${user._id}`);
                console.log(`     Phone: "${user.phone}"`);
                console.log(`     Phone bytes: ${Buffer.from(user.phone || '').toString('hex')}`);
            });
        } else {
            console.log('✅ No corrupted phone fields found');
        }

        console.log('\n🔍 Scanning for corrupted avatar fields...');
        const avatarCorrupted = await Users.find(
            { avatar: { $regex: 'â€"|â€™|â€˜|â€œ|â€|â„¹|â‚¦|Â·|â‰¥|â"€' } }
        ).select('_id name email avatar');

        if (avatarCorrupted.length > 0) {
            console.log(`⚠️  Found ${avatarCorrupted.length} corrupted avatar field(s):`);
            avatarCorrupted.forEach((user, idx) => {
                console.log(`\n  ${idx + 1}. ${user.name} (${user.email})`);
                console.log(`     User ID: ${user._id}`);
                console.log(`     Avatar: "${user.avatar}"`);
                console.log(`     Avatar bytes: ${Buffer.from(user.avatar || '').toString('hex')}`);
            });
        } else {
            console.log('✅ No corrupted avatar fields found');
        }

        // Check for exact string matches
        console.log('\n🔍 Checking for exact corrupted string matches...');
        const exactMatches = await Users.find(
            {
                $or: [
                    { phone: { $in: ['â€"', '—', 'â„¹ï¸', 'â„¹', 'â‚¦', 'Â·', 'â‰¥', 'â"€'] } },
                    { avatar: { $in: ['â€"', '—', 'â„¹ï¸', 'â„¹', 'â‚¦', 'Â·', 'â‰¥', 'â"€'] } }
                ]
            }
        ).select('_id name email phone avatar');

        if (exactMatches.length > 0) {
            console.log(`⚠️  Found ${exactMatches.length} exact corrupted matches:`);
            exactMatches.forEach((user, idx) => {
                console.log(`\n  ${idx + 1}. ${user.name} (${user.email})`);
                console.log(`     User ID: ${user._id}`);
                if (user.phone && typeof user.phone === 'string') {
                    console.log(`     Phone: "${user.phone}"`);
                }
                if (user.avatar && typeof user.avatar === 'string') {
                    console.log(`     Avatar: "${user.avatar}"`);
                }
            });
        } else {
            console.log('✅ No exact corrupted string matches found');
        }

        // Get total stats
        const totalUsers = await Users.countDocuments();
        const usersWithPhone = await Users.countDocuments({ phone: { $exists: true, $ne: null, $ne: '' } });
        const usersWithAvatar = await Users.countDocuments({ avatar: { $exists: true, $ne: null, $ne: '' } });

        console.log('\n📊 Database Statistics:');
        console.log(`  Total users: ${totalUsers}`);
        console.log(`  Users with non-empty phone: ${usersWithPhone}`);
        console.log(`  Users with non-empty avatar: ${usersWithAvatar}`);

        console.log('\n✅ Inspection completed!');
        console.log('ℹ️  To fix corrupted data, run: node apps/api/scripts/cleanCorruptedUserFields.js');

        process.exit(0);
    } catch (error) {
        console.error('❌ Inspection failed:', error.message);
        console.error(error);
        process.exit(1);
    }
};

inspectDatabase();
