// Phase 12B — safely creates the unique index on User.email that
// models/User.js now declares (`email: { ..., unique: true }`).
//
// MongoDB refuses to build a unique index over a collection that already
// contains duplicate values for that field — if this were left entirely to
// Mongoose's own autoIndex behavior at app startup, an existing database
// with duplicate emails could fail to get the index at all (silently, in
// the background) while the app keeps running unprotected, or surface as a
// confusing unhandled rejection during startup.
//
// This script is the explicit, safe alternative:
//   1. Scans for duplicate normalized (lowercased + trimmed) emails.
//   2. If any exist: writes a JSON report for manual review and exits
//      non-zero WITHOUT creating the index or touching any data. It never
//      deletes, merges, or otherwise resolves duplicates automatically —
//      that is a product/support decision, not something to guess at here.
//   3. If none exist: creates the unique index directly and exits 0.
//
// Run this BEFORE deploying the schema change to any environment whose
// database may already have real user records. Safe to re-run — it is
// read-only until the moment it creates the index, and creating an index
// that already exists is a no-op.
import 'dotenv/config';
import mongoose from 'mongoose';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.join(__dirname, 'duplicate-emails-report.json');

export async function findDuplicateEmails(usersCollection) {
  return usersCollection
    .aggregate([
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$email' } } },
          count: { $sum: 1 },
          userIds: { $push: '$_id' },
          usernames: { $push: '$username' },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();
}

export async function runMigration(usersCollection) {
  const duplicates = await findDuplicateEmails(usersCollection)

  if (duplicates.length > 0) {
    const report = {
      generatedAt: new Date().toISOString(),
      status: 'BLOCKED_BY_DUPLICATES',
      duplicateGroupCount: duplicates.length,
      affectedUserCount: duplicates.reduce((sum, d) => sum + d.count, 0),
      groups: duplicates.map((d) => ({
        normalizedEmail: d._id,
        count: d.count,
        userIds: d.userIds.map(String),
        usernames: d.usernames,
      })),
    }
    await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8')
    return report
  }

  await usersCollection.createIndex(
    { email: 1 },
    { unique: true, name: 'email_1_unique' }
  )

  const report = {
    generatedAt: new Date().toISOString(),
    status: 'INDEX_CREATED',
    duplicateGroupCount: 0,
  }
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8')
  return report
}

async function main() {
  await mongoose.connect(process.env.MONGO)
  try {
    const report = await runMigration(mongoose.connection.collection('users'))

    if (report.status === 'BLOCKED_BY_DUPLICATES') {
      console.error(
        `\n❌ Found ${report.duplicateGroupCount} duplicate email group(s) ` +
        `(${report.affectedUserCount} user records). The unique index was NOT created.\n` +
        `No data was changed. Full report written to: ${REPORT_PATH}\n` +
        `Resolve duplicates manually (merge/rename/deactivate as the business decides), ` +
        `then re-run this script.\n`
      )
      process.exitCode = 1
      return
    }

    console.log(`\n✅ No duplicate emails found. Unique index 'email_1_unique' created on users.email.\n`)
  } finally {
    await mongoose.disconnect()
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  main().catch((err) => {
    console.error('Migration failed:', err)
    process.exitCode = 1
  })
}
