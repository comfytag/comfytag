import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import { connectAmbientMemoryDb, disconnectAmbientMemoryDb, clearAmbientCollections } from './identity/test-support/ambient-memory-db'

// register() sends a real verification-OTP email (and a fire-and-forget
// welcome series) outside of test mode's queue path (`enqueueEmail` ->
// `sendEmail` directly) — mocked so the concurrent-registration test
// doesn't attempt a real network call to SES.
vi.mock('../../utils/sendEmail', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/sendEmail.js')>()
  return {
    ...actual,
    sendEmail: vi.fn().mockResolvedValue({ success: true }),
    sendEmails: vi.fn().mockResolvedValue(undefined),
    sendTicket: vi.fn().mockResolvedValue(undefined),
  }
})

import User from '../../models/User'
import authRouter from '../../routes/auth.js'
import { findDuplicateEmails, runMigration } from '../../scripts/migrate-unique-email-index.mjs'

// ============================================================================
// Phase 12B — unique email index + concurrent-registration regression tests
// ============================================================================
//
// The Phase 12A audit found User.email had no DB-level unique index — only
// an application-layer find-then-create check in controllers/auth.js
// #register (and controllers/admin.js#createAdminUser), which is racy: two
// concurrent requests can both pass the check before either saves,
// producing two accounts with the same email. models/User.js now declares
// `email: { ..., unique: true }`; these tests confirm the index is actually
// enforced, that normalization (lowercase/trim) is consistent, and that a
// real concurrent-registration race now results in exactly one account
// (with a clean 409, not a raw 500, for the loser).

let app: Express

async function createTestUser(overrides: Record<string, unknown> = {}) {
  const salt = await bcrypt.genSalt(10)
  const password = await bcrypt.hash('TestPassword123!', salt)
  const user = new User({
    username: `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test User',
    email: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
    password,
    referralCode: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...overrides,
  })
  return await user.save()
}

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'
  process.env.SALT = process.env.SALT || '10'
  await connectAmbientMemoryDb()
  // The unique index is created lazily by Mongoose's autoIndex — force it
  // to finish building before any test relies on it being enforced.
  await User.init()

  app = express()
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
  app.use(cookieParser())
  app.use('/auth', authRouter)

  app.use((err: any, req: any, res: any, next: any) => {
    const status = err.status || err.statusCode || 500
    const message = err.message || 'Something went wrong'
    res.status(status).json({ success: false, message })
  })
}, 120_000)

afterAll(async () => {
  await disconnectAmbientMemoryDb()
}, 30_000)

beforeEach(async () => {
  await clearAmbientCollections()
})

describe('User.email unique index (Phase 12B)', () => {
  it('rejects a second document with the exact same email at the DB level', async () => {
    await createTestUser({ email: 'dup@example.com' })

    await expect(createTestUser({ email: 'dup@example.com', username: 'someoneelse' })).rejects.toMatchObject({
      code: 11000,
    })
  })

  it('normalizes case/whitespace so a duplicate cannot slip past differently-cased input', async () => {
    await createTestUser({ email: 'dup@example.com' })

    await expect(
      createTestUser({ email: '  DUP@Example.com  ', username: 'someoneelse2' })
    ).rejects.toMatchObject({ code: 11000 })
  })

  it('allows two distinct emails', async () => {
    await createTestUser({ email: 'first@example.com' })
    await expect(createTestUser({ email: 'second@example.com', username: 'seconduser' })).resolves.toBeTruthy()
  })
})

describe('POST /auth/register — concurrent registration (Phase 12B)', () => {
  it('two concurrent registrations with the same email: exactly one account is created', async () => {
    const email = `race_${Date.now()}@example.com`
    const payload = (username: string) => ({
      username,
      name: 'Race Condition',
      email,
      password: 'TestPassword123!',
      confirm_password: 'TestPassword123!',
    })

    const [res1, res2] = await Promise.all([
      request(app).post('/auth/register').send(payload('racer_one')),
      request(app).post('/auth/register').send(payload('racer_two')),
    ])

    const statuses = [res1.status, res2.status].sort()
    // One request wins the race and creates the account (201); the other
    // loses — whether it lost the pre-check or the race underneath it, it
    // gets the same clean 409, never a raw 500 from an uncaught E11000.
    expect(statuses).toEqual([201, 409])

    const accountsWithThisEmail = await User.countDocuments({ email: email.toLowerCase() })
    expect(accountsWithThisEmail).toBe(1)
  })
})

describe('scripts/migrate-unique-email-index.mjs (Phase 12B)', () => {
  it('findDuplicateEmails finds no duplicates in a clean collection', async () => {
    await createTestUser({ email: 'clean-a@example.com' })
    await createTestUser({ email: 'clean-b@example.com', username: 'cleanb' })

    const duplicates = await findDuplicateEmails(User.collection)
    expect(duplicates).toHaveLength(0)
  })

  it('runMigration reports BLOCKED_BY_DUPLICATES and does not touch data when duplicates exist', async () => {
    // Simulates a database that predates this phase's schema change — no
    // unique index yet, and (unbeknownst to anyone) duplicate emails already
    // exist. Mongoose's own autoIndex would otherwise have already built the
    // index from the schema in beforeAll, which would make this insert
    // itself fail instead of exercising the migration's own duplicate check.
    await User.collection.dropIndexes().catch(() => {})
    await User.collection.insertMany([
      {
        username: 'legacydupe1',
        name: 'Legacy One',
        email: 'legacydupe@example.com',
        password: 'x',
        referralCode: 'legacy-ref-1',
      },
      {
        username: 'legacydupe2',
        name: 'Legacy Two',
        email: 'legacydupe@example.com',
        password: 'x',
        referralCode: 'legacy-ref-2',
      },
    ])

    const report = await runMigration(User.collection)
    expect(report.status).toBe('BLOCKED_BY_DUPLICATES')
    expect(report.duplicateGroupCount).toBe(1)

    const stillBothPresent = await User.collection.countDocuments({ email: 'legacydupe@example.com' })
    expect(stillBothPresent).toBe(2) // nothing deleted or merged

    const indexes = await User.collection.indexes()
    expect(indexes.find((i) => i.name === 'email_1_unique')).toBeUndefined()
  })

  it('runMigration creates the unique index when no duplicates exist', async () => {
    await User.collection.dropIndexes().catch(() => {})
    await createTestUser({ email: 'safe-to-index@example.com' })

    const report = await runMigration(User.collection)
    expect(report.status).toBe('INDEX_CREATED')

    const indexes = await User.collection.indexes()
    expect(indexes.find((i) => i.name === 'email_1_unique')).toBeTruthy()
  })
})
