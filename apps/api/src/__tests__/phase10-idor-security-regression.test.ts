import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import http from 'node:http'
import request from 'supertest'
import express, { Express } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { connectAmbientMemoryDb, disconnectAmbientMemoryDb, clearAmbientCollections } from './identity/test-support/ambient-memory-db'

import User from '../../models/User'
import Event from '../../models/Event'
import Audience from '../../models/Audience'
import Withdraw from '../../models/Withdraw'

import usersRouter from '../../routes/users'
import audienceRouter from '../../routes/audience'
import faceRouter from '../../routes/face'
import ticketTokenRouter from '../../routes/ticketToken'
import promosRouter from '../../routes/promos'
import withdrawRouter from '../../routes/withdraw'
import bankRouter from '../../routes/bank'

// ============================================================================
// Phase 10 — legacy IDOR/authorization audit fixes, regression tests
// ============================================================================
//
// Each `describe` block below corresponds to one confirmed finding from the
// Phase 10 Part F legacy read-path audit. Routers are mounted bare (no outer
// middleware), matching the most exposed real mount point in app.js, so a
// pass here proves the fix holds regardless of which app.js mount is hit.

vi.mock('../../utils/sendEmail', () => ({
  sendEmails: vi.fn().mockResolvedValue(undefined),
  sendTicket: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../../utils/QRCode', () => ({
  QR: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
}))

let app: Express
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'

async function createTestUser(overrides: Record<string, unknown> = {}) {
  const salt = await bcrypt.genSalt(10)
  const password = await bcrypt.hash('TestPassword123!', salt)
  const user = new User({
    username: `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test User',
    email: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
    password,
    phone: 2348012345670 + Math.random() * 100,
    isPartner: false,
    isAdmin: false,
    faceEnrolled: false,
    referralCode: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...overrides,
  })
  return await user.save()
}

async function createTestEvent(plannerUserId: string, overrides: Record<string, unknown> = {}) {
  const event = new Event({
    name: `Test Event ${Date.now()}`,
    planner_id: plannerUserId.toString(),
    planner: 'Test Planner',
    category: 'music',
    description: 'Test event',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    address: 'Test Address',
    state: 'Lagos',
    venue: 'Test Venue',
    ticketType: [{ name: 'General', price: 1000, capacity: 10, sold: 0 }],
    status: 'published',
    ...overrides,
  })
  return await event.save()
}

async function createTestTicket(userId: string, eventId: string, overrides: Record<string, unknown> = {}) {
  const ticket = new Audience({
    user_id: userId.toString(),
    event_id: eventId.toString(),
    name: 'Test Attendee',
    email: `attendee_${Date.now()}@example.com`,
    phone: 2348012345670 + Math.random() * 100,
    eventname: 'Test Event',
    type: 'General',
    amount: 1000,
    numOfTicket: 1,
    status: 'active',
    reference: `REF${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    totpSecret: 'test-secret',
    qrCode: 'data:image/png;base64,test',
    ...overrides,
  })
  return await ticket.save()
}

async function createTestWithdraw(userId: string, overrides: Record<string, unknown> = {}) {
  const withdraw = new Withdraw({
    user_id: userId.toString(),
    bankName: 'Test Bank',
    acctName: 'Test Organizer',
    acctNumber: '0123456789',
    eventName: 'Test Event',
    amount: 5000,
    status: 'pending',
    ...overrides,
  })
  return await withdraw.save()
}

function signTestToken(userId: string | mongoose.Types.ObjectId, claims: { isPartner?: boolean; isAdmin?: boolean; role?: string } = {}) {
  return jwt.sign(
    {
      id: userId.toString(),
      _id: userId.toString(),
      email: 'test@example.com',
      isPartner: claims.isPartner ?? false,
      isAdmin: claims.isAdmin ?? false,
      role: claims.role,
    },
    TEST_JWT_SECRET,
    { expiresIn: '7d' }
  )
}

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_JWT_SECRET
  await connectAmbientMemoryDb()

  app = express()
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
  app.use(cookieParser())
  app.use('/users', usersRouter)
  app.use('/audience', audienceRouter)
  app.use('/face', faceRouter)
  app.use('/tickets', ticketTokenRouter)
  app.use('/', promosRouter)
  app.use('/withdraw', withdrawRouter)
  app.use('/bank', bankRouter)

  app.use((err: any, req: any, res: any, next: any) => {
    const status = err.status || err.statusCode || 500
    res.status(status).json({ success: false, message: err.message || 'Something went wrong' })
  })
}, 120_000)

afterAll(async () => {
  await disconnectAmbientMemoryDb()
}, 30_000)

beforeEach(async () => {
  await clearAmbientCollections()
})

describe('GET /users/:id — public profile field allowlist + privacy opt-out', () => {
  it('never returns phone, email, address, or KYC document URLs, even though the route is unauthenticated', async () => {
    const user = await createTestUser({
      name: 'Public Organizer',
      phone: '2348012345678',
      address: 'lagos, nigeria',
      verify: { photo: 'https://cdn.example.com/selfie.jpg', idType: 'nin', idDocument: 'https://cdn.example.com/id.jpg' },
      kycStatus: 'verified',
    })

    const res = await request(app).get(`/users/${user._id.toString()}`)

    expect(res.status).toBe(200)
    expect(res.body.phone).toBeUndefined()
    expect(res.body.email).toBeUndefined()
    expect(res.body.address).toBeUndefined()
    expect(res.body.verify).toBeUndefined()
    expect(res.body.kycStatus).toBeUndefined()
    expect(res.body.password).toBeUndefined()
    // Still returns the legitimate public profile fields.
    expect(res.body.username).toBe(user.username)
    expect(res.body.name).toBe('Public Organizer')
  })

  it('a user who opted out of a public profile is not found', async () => {
    const user = await createTestUser({ privacySettings: { publicProfile: false, showInSearch: true } })
    const res = await request(app).get(`/users/${user._id.toString()}`)
    expect(res.status).toBe(404)
  })

  // Frontend-compatibility closure (Phase 10 closure prompt, item 4): the
  // web/partner/mobile "my profile" and settings screens read phone, email,
  // kycStatus, privacySettings, and notificationPreferences directly off
  // this same GET — they broke when the allowlist above first shipped.
  // optionalAuth + isSelfOrAdmin (controllers/users.js#getUser) restores
  // those fields for the profile's own owner (or an admin) only.
  it('a different authenticated (non-owner, non-admin) caller still does not see phone/email/kycStatus', async () => {
    const owner = await createTestUser({ name: 'Owner', phone: '2348012345678', kycStatus: 'verified' })
    const stranger = await createTestUser({ name: 'Stranger' })

    const res = await request(app)
      .get(`/users/${owner._id.toString()}`)
      .set('Authorization', `Bearer ${signTestToken(stranger._id.toString())}`)

    expect(res.status).toBe(200)
    expect(res.body.phone).toBeUndefined()
    expect(res.body.email).toBeUndefined()
    expect(res.body.kycStatus).toBeUndefined()
    expect(res.body.privacySettings).toBeUndefined()
  })

  it('the profile\'s own owner sees phone, email, kycStatus, privacySettings, and notificationPreferences', async () => {
    const owner = await createTestUser({ name: 'Owner', phone: '2348012345678', kycStatus: 'verified' })

    const res = await request(app)
      .get(`/users/${owner._id.toString()}`)
      .set('Authorization', `Bearer ${signTestToken(owner._id.toString())}`)

    expect(res.status).toBe(200)
    expect(res.body.phone).toBe('2348012345678')
    expect(res.body.email).toBe(owner.email)
    expect(res.body.kycStatus).toBe('verified')
    expect(res.body.privacySettings).toBeDefined()
    expect(res.body.notificationPreferences).toBeDefined()
    // Still never leaks the raw KYC document/selfie URLs, password, or biometric template.
    expect(res.body.verify).toBeUndefined()
    expect(res.body.password).toBeUndefined()
    expect(res.body.faceTemplate).toBeUndefined()
  })

  it('an admin sees another user\'s self-only fields too', async () => {
    const owner = await createTestUser({ name: 'Owner', phone: '2348012345678' })
    const admin = await createTestUser({ name: 'Admin', isAdmin: true })

    const res = await request(app)
      .get(`/users/${owner._id.toString()}`)
      .set('Authorization', `Bearer ${signTestToken(admin._id.toString(), { isAdmin: true })}`)

    expect(res.status).toBe(200)
    expect(res.body.phone).toBe('2348012345678')
  })

  it('the owner can still see their own profile even after opting out of public visibility', async () => {
    const owner = await createTestUser({ privacySettings: { publicProfile: false, showInSearch: true } })

    const res = await request(app)
      .get(`/users/${owner._id.toString()}`)
      .set('Authorization', `Bearer ${signTestToken(owner._id.toString())}`)

    expect(res.status).toBe(200)
    expect(res.body.privacySettings.publicProfile).toBe(false)
  })
})

describe('GET /audience/user/:userId — ownership hotfix', () => {
  it('a stranger cannot list another user\'s tickets by guessing their user id', async () => {
    const owner = await createTestUser({ name: 'Ticket Owner' })
    const stranger = await createTestUser({ name: 'Stranger' })
    const event = await createTestEvent(owner._id.toString())
    await createTestTicket(owner._id.toString(), event._id.toString())

    const res = await request(app)
      .get(`/audience/user/${owner._id.toString()}`)
      .set('Authorization', `Bearer ${signTestToken(stranger._id)}`)

    expect(res.status).toBe(403)
  })

  it('the owner can still list their own tickets', async () => {
    const owner = await createTestUser({ name: 'Ticket Owner' })
    const event = await createTestEvent(owner._id.toString())
    await createTestTicket(owner._id.toString(), event._id.toString())

    const res = await request(app)
      .get(`/audience/user/${owner._id.toString()}`)
      .set('Authorization', `Bearer ${signTestToken(owner._id)}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(1)
  })

  it('an admin can list any user\'s tickets', async () => {
    const owner = await createTestUser({ name: 'Ticket Owner' })
    const admin = await createTestUser({ name: 'Admin', isAdmin: true })
    const event = await createTestEvent(owner._id.toString())
    await createTestTicket(owner._id.toString(), event._id.toString())

    const res = await request(app)
      .get(`/audience/user/${owner._id.toString()}`)
      .set('Authorization', `Bearer ${signTestToken(admin._id, { isAdmin: true })}`)

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
  })
})

describe('GET /tickets/:id/status — ownership hotfix', () => {
  it('a stranger cannot poll check-in status for someone else\'s ticket', async () => {
    const owner = await createTestUser({ name: 'Ticket Owner' })
    const stranger = await createTestUser({ name: 'Stranger' })
    const event = await createTestEvent(owner._id.toString())
    const ticket = await createTestTicket(owner._id.toString(), event._id.toString())

    const res = await request(app)
      .get(`/tickets/${ticket._id.toString()}/status`)
      .set('Authorization', `Bearer ${signTestToken(stranger._id)}`)

    expect(res.status).toBe(403)
  })

  it('the owner can poll their own ticket\'s check-in status', async () => {
    const owner = await createTestUser({ name: 'Ticket Owner' })
    const event = await createTestEvent(owner._id.toString())
    const ticket = await createTestTicket(owner._id.toString(), event._id.toString())

    // The SSE endpoint never closes its own response (it relies on the
    // client disconnecting), so `supertest`'s promise — which waits for the
    // full response body — would hang. Use a raw request and resolve as
    // soon as the response headers arrive, then destroy the socket.
    const server = app.listen(0)
    try {
      const port = (server.address() as { port: number }).port
      const statusCode = await new Promise<number>((resolve, reject) => {
        const req = http.request(
          { host: '127.0.0.1', port, path: `/tickets/${ticket._id.toString()}/status`, method: 'GET', headers: { Authorization: `Bearer ${signTestToken(owner._id)}` } },
          (res) => {
            resolve(res.statusCode ?? 0)
            res.destroy()
          }
        )
        req.on('error', reject)
        req.end()
      })
      expect(statusCode).toBe(200)
    } finally {
      server.close()
    }
  })
})

describe('GET /events/:id/promos — organizer-ownership hotfix', () => {
  it('a stranger cannot list another organizer\'s promo codes', async () => {
    const owner = await createTestUser({ name: 'Organizer' })
    const stranger = await createTestUser({ name: 'Stranger' })
    const event = await createTestEvent(owner._id.toString(), {
      promos: [{ code: 'SECRET10', discountType: 'percentage', discountValue: 10, usedCount: 0, isActive: true }],
    })

    const res = await request(app)
      .get(`/events/${event._id.toString()}/promos`)
      .set('Authorization', `Bearer ${signTestToken(stranger._id)}`)

    expect(res.status).toBe(403)
  })

  it('the owning organizer can still list their own promo codes', async () => {
    const owner = await createTestUser({ name: 'Organizer' })
    const event = await createTestEvent(owner._id.toString(), {
      promos: [{ code: 'SECRET10', discountType: 'percentage', discountValue: 10, usedCount: 0, isActive: true }],
    })

    const res = await request(app)
      .get(`/events/${event._id.toString()}/promos`)
      .set('Authorization', `Bearer ${signTestToken(owner._id)}`)

    expect(res.status).toBe(200)
    expect(res.body.promoCodes.length).toBe(1)
  })
})

describe('POST /face/verify — per-event organizer authorization hotfix', () => {
  it('a user with no relationship to the event cannot run face check-in against it', async () => {
    const owner = await createTestUser({ name: 'Organizer' })
    const stranger = await createTestUser({ name: 'Stranger' })
    const event = await createTestEvent(owner._id.toString())

    const res = await request(app)
      .post('/face/verify')
      .set('Authorization', `Bearer ${signTestToken(stranger._id)}`)
      .send({ faceTemplate: 'anything-nonempty', eventId: event._id.toString() })

    expect(res.status).toBe(403)
  })

  it('the event\'s own organizer can run face check-in against it', async () => {
    const owner = await createTestUser({ name: 'Organizer' })
    const event = await createTestEvent(owner._id.toString())

    const res = await request(app)
      .post('/face/verify')
      .set('Authorization', `Bearer ${signTestToken(owner._id)}`)
      .send({ faceTemplate: 'anything-nonempty', eventId: event._id.toString() })

    // No face-enrolled attendees exist yet — 200 with success:false, but
    // critically NOT a 403. Proves authorization passed and the (unrelated,
    // pre-existing, documented mock-comparator) matching logic ran.
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(false)
  })

  it('a global admin can run face check-in for any event', async () => {
    const owner = await createTestUser({ name: 'Organizer' })
    const admin = await createTestUser({ name: 'Admin', isAdmin: true })
    const event = await createTestEvent(owner._id.toString())

    const res = await request(app)
      .post('/face/verify')
      .set('Authorization', `Bearer ${signTestToken(admin._id, { isAdmin: true })}`)
      .send({ faceTemplate: 'anything-nonempty', eventId: event._id.toString() })

    expect(res.status).toBe(200)
  })
})

describe('GET /withdraw/show/:id — ownership hotfix (was fail-closed for everyone but an admin)', () => {
  it('a stranger cannot read another user\'s withdrawal record', async () => {
    const owner = await createTestUser({ name: 'Organizer' })
    const stranger = await createTestUser({ name: 'Stranger' })
    const withdraw = await createTestWithdraw(owner._id.toString())

    const res = await request(app)
      .get(`/withdraw/show/${withdraw._id.toString()}`)
      .set('Authorization', `Bearer ${signTestToken(stranger._id)}`)

    expect(res.status).toBe(403)
  })

  it('the owner can now read their own withdrawal record (previously blocked by the verifyUser id-shape bug)', async () => {
    const owner = await createTestUser({ name: 'Organizer' })
    const withdraw = await createTestWithdraw(owner._id.toString())

    const res = await request(app)
      .get(`/withdraw/show/${withdraw._id.toString()}`)
      .set('Authorization', `Bearer ${signTestToken(owner._id)}`)

    expect(res.status).toBe(200)
    expect(res.body._id).toBe(withdraw._id.toString())
  })
})

describe('PUT /bank/edit/:id — owner reachability hotfix (was fail-closed for everyone but an admin)', () => {
  it('the owner is no longer blocked before reaching the controller\'s own ownership/field checks', async () => {
    const { default: Bank } = await import('../../models/Bank')
    const owner = await createTestUser({ name: 'Organizer' })
    const bank = await new Bank({
      user_id: owner._id.toString(),
      bankName: 'Test Bank',
      bankCode: '001',
      acctName: 'Test Organizer',
      acctNumber: '0123456789',
      isActive: true,
    }).save()

    const res = await request(app)
      .put(`/bank/edit/${bank._id.toString()}`)
      .set('Authorization', `Bearer ${signTestToken(owner._id)}`)
      .send({})

    // The controller has no success path for an empty body (by design — see
    // updateBank's doc comment); what matters here is that the owner reaches
    // that controller logic (400) instead of being rejected at the
    // middleware layer before ever getting there (403).
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/no editable fields/i)
  })

  it('a stranger is still rejected', async () => {
    const { default: Bank } = await import('../../models/Bank')
    const owner = await createTestUser({ name: 'Organizer' })
    const stranger = await createTestUser({ name: 'Stranger' })
    const bank = await new Bank({
      user_id: owner._id.toString(),
      bankName: 'Test Bank',
      bankCode: '001',
      acctName: 'Test Organizer',
      acctNumber: '0123456789',
      isActive: true,
    }).save()

    const res = await request(app)
      .put(`/bank/edit/${bank._id.toString()}`)
      .set('Authorization', `Bearer ${signTestToken(stranger._id)}`)
      .send({})

    expect(res.status).toBe(403)
  })
})
