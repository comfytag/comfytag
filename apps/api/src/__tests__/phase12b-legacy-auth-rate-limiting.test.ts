import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { connectAmbientMemoryDb, disconnectAmbientMemoryDb, clearAmbientCollections } from './identity/test-support/ambient-memory-db'

// These endpoints only ever touch email/OTP lookups for accounts that don't
// need to exist for this test (all responses are intentionally generic
// either way) — no outbound email is sent on any of these paths, so no
// email mock is required here (unlike the register() tests elsewhere).

import authRouter from '../../routes/auth.js'

// ============================================================================
// Phase 12B — legacy authentication rate-limiting regression tests
// ============================================================================
//
// The Phase 12A audit found two gaps in the legacy auth surface's existing
// rate limiting (login/OTP/forgot-password already had a shared 10-per-
// 15-minutes limiter): POST /auth/register had no limiter at all (unlimited
// automated account creation), and POST /auth/reset-password — the step
// that actually spends a short-lived reset JWT — also had none. OTP
// verification (verify-otp, verify-email-otp) now has its own stricter,
// dedicated limiter instead of sharing the generic one. These tests confirm
// each new/tightened limiter actually triggers, and that its response
// reveals nothing about whether a given account exists.

let app: Express

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'
  process.env.SALT = process.env.SALT || '10'
  await connectAmbientMemoryDb()

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

describe('POST /auth/register — rate limiting (Phase 12B)', () => {
  it('eventually returns 429 after repeated registration attempts from the same client', async () => {
    const attempts = Array.from({ length: 35 }, (_, i) =>
      request(app)
        .post('/auth/register')
        .send({
          username: `ratelimit_user_${i}_${Math.random().toString(36).slice(2, 8)}`,
          name: 'Rate Limit Test',
          email: `ratelimit_${i}_${Math.random().toString(36).slice(2, 8)}@example.com`,
          password: 'not-a-real-password', // fails Joi complexity — 400s exercise the limiter without creating accounts or sending email
          confirm_password: 'not-a-real-password',
        })
    )

    const results = await Promise.all(attempts)
    const statuses = results.map((r) => r.status)
    expect(statuses).toContain(429)
  })
})

describe('POST /auth/reset-password — rate limiting (Phase 12B)', () => {
  it('eventually returns 429 after repeated reset attempts from the same client', async () => {
    const attempts = Array.from({ length: 15 }, () =>
      request(app).post('/auth/reset-password').send({
        identifier: 'someone@example.com',
        resetToken: 'not-a-real-token',
        newPassword: 'irrelevant',
      })
    )

    const results = await Promise.all(attempts)
    const statuses = results.map((r) => r.status)
    expect(statuses).toContain(429)
  })

  it('the rate-limit response reveals nothing about whether the account exists', async () => {
    const attempts = Array.from({ length: 15 }, () =>
      request(app).post('/auth/reset-password').send({
        identifier: 'someone@example.com',
        resetToken: 'not-a-real-token',
        newPassword: 'irrelevant',
      })
    )
    const results = await Promise.all(attempts)
    const limited = results.find((r) => r.status === 429)

    expect(limited).toBeTruthy()
    expect(JSON.stringify(limited!.body).toLowerCase()).not.toMatch(/exist|not found|no account/)
  })
})

describe('POST /auth/verify-otp — dedicated stricter OTP rate limiting (Phase 12B)', () => {
  it('eventually returns 429, and does so at least as aggressively as the shared 10/15min limiter', async () => {
    const attempts = Array.from({ length: 10 }, () =>
      request(app).post('/auth/verify-otp').send({ identifier: 'someone@example.com', otp: '000000' })
    )

    const results = await Promise.all(attempts)
    const statuses = results.map((r) => r.status)
    expect(statuses).toContain(429)
  })
})
