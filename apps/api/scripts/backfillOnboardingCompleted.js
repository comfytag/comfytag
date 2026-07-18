/**
 * Migration Script: Backfill onboarding.completed for existing partners
 *
 * The partner app now gates new organizers into a one-time onboarding wizard
 * right after registration or the attendee→partner handoff. Existing partner
 * accounts predate the `onboarding.completed` flag and would otherwise be
 * forced through the wizard on their next login — this backfills them as
 * already complete so only new signups/handoffs see the gate.
 *
 * Run with: node apps/api/scripts/backfillOnboardingCompleted.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Users from '../models/User.js';

dotenv.config();

const backfill = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/comfytag';
        await mongoose.connect(mongoUrl);
        console.log('✅ Connected to MongoDB');

        console.log('\n📋 Backfilling onboarding.completed for existing partners...');
        const result = await Users.updateMany(
            {
                isPartner: true,
                'onboarding.completed': { $ne: true },
            },
            { $set: { 'onboarding.completed': true } }
        );
        console.log(`✅ Backfilled ${result.modifiedCount} partner account(s)`);

        const remaining = await Users.countDocuments({
            isPartner: true,
            'onboarding.completed': { $ne: true },
        });
        console.log(`📊 Partners still without onboarding.completed: ${remaining}`);

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
};

backfill();
