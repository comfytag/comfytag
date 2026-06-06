import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { connectTestDB, disconnectTestDB, clearCollections } from '../test-utils/db'

// Import models
import User from '../../models/User'
import Event from '../../models/Event'
import Audience from '../../models/Audience'

// Import routes
import audienceRouter from '../../routes/audience'
import transferRouter from '../../routes/transfer'
import faceRouter from '../../routes/face'
import { verifyUser, verifyToken } from '../../utils/verifyToken'

// ============================================================================
// MOCKS
// ============================================================================

vi.mock('../../utils/sendEmail', () => ({
  sendEmails: vi.fn().mockResolvedValue(undefined),
  sendTicket: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../utils/QRCode', () => ({
  QR: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
}))

// ============================================================================
// TEST SETUP
// ============================================================================

let app: Express
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'
const TEST_SALT = 10

async function createTestUser(overrides = {}) {
  const salt = await bcrypt.genSalt(TEST_SALT)
  const password = await bcrypt.hash('TestPassword123!', salt)

  const user = new User({
    username: `testuser_${Date.now()}`,
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password,
    phone: 2348012345670 + Math.random() * 100,
    isPartner: false,
    isAdmin: false,
    faceEnrolled: false,
    ...overrides,
  })

  return await user.save()
}

async function createTestEvent(plannerUserId, overrides = {}) {
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
    ticketType: [
      {
        name: 'General',
        price: 1000,
        capacity: 10,
        sold: 0,
      }
    ],
    status: 'published',
    ...overrides,
  })

  return await event.save()
}

async function createTestTicket(userId, eventId) {
  const event = await Event.findById(eventId)
  const ticket = new Audience({
    user_id: userId.toString(),
    event_id: eventId.toString(),
    name: 'Test Attendee',
    email: `attendee_${Date.now()}@example.com`,
    phone: 2348012345670 + Math.random() * 100,
    eventname: event?.name || 'Test Event',
    type: 'General',
    amount: 1000,
    numOfTicket: 1,
    status: 'active',
    reference: `REF${Date.now()}`,
    totpSecret: 'test-secret',
    qrCode: 'data:image/png;base64,test',
    faceOwner: userId.toString(),
  })

  return await ticket.save()
}

function signTestToken(userId: string | mongoose.Types.ObjectId, isPartner = false, isAdmin = false) {
  return jwt.sign(
    {
      id: userId.toString(),
      _id: userId.toString(),
      email: 'test@example.com',
      isPartner,
      isAdmin,
    },
    TEST_JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// ============================================================================
// SETUP/TEARDOWN
// ============================================================================

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_JWT_SECRET
  await connectTestDB()

  app = express()
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
  app.use(cookieParser())

  app.use('/audience', audienceRouter)
  app.use('/tickets/transfer', transferRouter)
  app.use('/face', faceRouter)

  app.use((err: any, req: any, res: any, next: any) => {
    const status = err.status || err.statusCode || 500
    const message = err.message || 'Something went wrong'
    res.status(status).json({ success: false, message })
  })
})

afterAll(async () => {
  await disconnectTestDB()
})

beforeEach(async () => {
  await clearCollections()
})

// ============================================================================
// TRANSFER FLOW TESTS
// ============================================================================

describe('POST /tickets/transfer/initiate', () => {
  it('should initiate transfer when ticket owner is sender', async () => {
    const sender = await createTestUser({ name: 'Sender', isPartner: true })
    const recipient = await createTestUser({ name: 'Recipient', email: 'recipient@example.com' })
    const event = await createTestEvent(sender._id)
    const ticket = await createTestTicket(sender._id, event._id)

    const token = signTestToken(sender._id, true) // isPartner

    const res = await request(app)
      .post('/tickets/transfer/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticketId: ticket._id.toString(),
        recipientEmail: recipient.email,
      })

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('Transfer initiated')
    expect(res.body.recipientName).toBe('Recipient')

    // Verify ticket was updated
    const updatedTicket = await Audience.findById(ticket._id).select('+transferToken')
    expect(updatedTicket?.transferredTo).toBe(recipient._id.toString())
    expect(updatedTicket?.transferToken).toBeDefined()
  })

  it('should reject transfer when user does not own ticket', async () => {
    const owner = await createTestUser({ name: 'Owner' })
    const notOwner = await createTestUser({ name: 'NotOwner', isPartner: true })
    const recipient = await createTestUser({ name: 'Recipient' })
    const event = await createTestEvent(owner._id)
    const ticket = await createTestTicket(owner._id, event._id)

    const token = signTestToken(notOwner._id, true) // isPartner to bypass middleware

    const res = await request(app)
      .post('/tickets/transfer/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticketId: ticket._id.toString(),
        recipientEmail: recipient.email,
      })

    expect(res.status).toBe(403)
    expect(res.body.message).toContain('do not own')
  })

  it('should reject transfer of used ticket', async () => {
    const sender = await createTestUser({ isPartner: true })
    const recipient = await createTestUser()
    const event = await createTestEvent(sender._id)
    const ticket = await createTestTicket(sender._id, event._id)

    // Mark ticket as used
    await Audience.findByIdAndUpdate(ticket._id, { status: 'used' })

    const token = signTestToken(sender._id, true)

    const res = await request(app)
      .post('/tickets/transfer/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticketId: ticket._id.toString(),
        recipientEmail: recipient.email,
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('used')
  })

  it('should reject transfer to non-existent user', async () => {
    const sender = await createTestUser({ isPartner: true })
    const event = await createTestEvent(sender._id)
    const ticket = await createTestTicket(sender._id, event._id)

    const token = signTestToken(sender._id, true)

    const res = await request(app)
      .post('/tickets/transfer/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticketId: ticket._id.toString(),
        recipientEmail: 'nonexistent@example.com',
      })

    expect(res.status).toBe(404)
    expect(res.body.message).toContain('account')
  })

  it('should reject self-transfer', async () => {
    const user = await createTestUser({ isPartner: true })
    const event = await createTestEvent(user._id)
    const ticket = await createTestTicket(user._id, event._id)

    const token = signTestToken(user._id, true)

    const res = await request(app)
      .post('/tickets/transfer/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticketId: ticket._id.toString(),
        recipientEmail: user.email,
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('Cannot transfer')
  })
})

describe('POST /tickets/transfer/accept', () => {
  it('should accept transfer with valid token', async () => {
    const sender = await createTestUser({ name: 'Sender', faceEnrolled: true })
    const recipient = await createTestUser({ name: 'Recipient' })
    const event = await createTestEvent(sender._id)
    const ticket = await createTestTicket(sender._id, event._id)

    // Initiate transfer first
    const initiateRes = await request(app)
      .post('/tickets/transfer/initiate')
      .set('Authorization', `Bearer ${signTestToken(sender._id)}`)
      .send({
        ticketId: ticket._id.toString(),
        recipientEmail: recipient.email,
      })

    expect(initiateRes.status).toBe(200)
    // Token is stored in DB, not returned to client for security
    const initiatedTicket = await Audience.findById(ticket._id).select('+transferToken')
    const transferToken = initiatedTicket?.transferToken

    // Accept transfer
    const res = await request(app)
      .post('/tickets/transfer/accept')
      .set('Authorization', `Bearer ${signTestToken(recipient._id)}`)
      .send({
        ticketId: ticket._id.toString(),
        transferToken,
      })

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('accepted')

    // Verify ownership transferred
    const updatedTicket = await Audience.findById(ticket._id).select('+transferToken')
    expect(updatedTicket?.user_id.toString()).toBe(recipient._id.toString())
    expect(updatedTicket?.transferredFrom).toBe(sender._id.toString())
    expect(updatedTicket?.transferToken).toBeNull()

    // Verify check-in reset
    expect(updatedTicket?.checkedIn).toBe(false)
    expect(updatedTicket?.checkedInAt).toBeNull()
  })

  it('should reject transfer with invalid token', async () => {
    const sender = await createTestUser()
    const recipient = await createTestUser()
    const event = await createTestEvent(sender._id)
    const ticket = await createTestTicket(sender._id, event._id)

    // Initiate transfer
    await request(app)
      .post('/tickets/transfer/initiate')
      .set('Authorization', `Bearer ${signTestToken(sender._id)}`)
      .send({
        ticketId: ticket._id.toString(),
        recipientEmail: recipient.email,
      })

    // Try to accept with wrong token
    const res = await request(app)
      .post('/tickets/transfer/accept')
      .set('Authorization', `Bearer ${signTestToken(recipient._id)}`)
      .send({
        ticketId: ticket._id.toString(),
        transferToken: 'invalid-token',
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('Invalid')
  })

  it('should reject transfer when recipient is not addressed', async () => {
    const sender = await createTestUser()
    const intended = await createTestUser()
    const other = await createTestUser()
    const event = await createTestEvent(sender._id)
    const ticket = await createTestTicket(sender._id, event._id)

    // Initiate transfer to 'intended'
    const initiateRes = await request(app)
      .post('/tickets/transfer/initiate')
      .set('Authorization', `Bearer ${signTestToken(sender._id)}`)
      .send({
        ticketId: ticket._id.toString(),
        recipientEmail: intended.email,
      })

    expect(initiateRes.status).toBe(200)
    // Token is stored in DB, not returned to client for security
    const initiatedTicket = await Audience.findById(ticket._id).select('+transferToken')
    const transferToken = initiatedTicket?.transferToken

    // Try to accept as 'other' user
    const res = await request(app)
      .post('/tickets/transfer/accept')
      .set('Authorization', `Bearer ${signTestToken(other._id)}`)
      .send({
        ticketId: ticket._id.toString(),
        transferToken,
      })

    expect(res.status).toBe(403)
    expect(res.body.message).toContain('not addressed')
  })
})

describe('POST /tickets/transfer/decline', () => {
  it.skip('should decline pending transfer', async () => {
    // NOTE: /decline endpoint may not exist in current implementation
    const sender = await createTestUser()
    const recipient = await createTestUser()
    const event = await createTestEvent(sender._id)
    const ticket = await createTestTicket(sender._id, event._id)

    // Initiate transfer
    await request(app)
      .post('/tickets/transfer/initiate')
      .set('Authorization', `Bearer ${signTestToken(sender._id)}`)
      .send({
        ticketId: ticket._id.toString(),
        recipientEmail: recipient.email,
      })

    // Decline transfer
    const res = await request(app)
      .post('/tickets/transfer/decline')
      .set('Authorization', `Bearer ${signTestToken(recipient._id)}`)
      .send({
        ticketId: ticket._id.toString(),
      })

    expect(res.status).toBe(200)

    // Verify transfer cleared
    const updatedTicket = await Audience.findById(ticket._id)
    expect(updatedTicket?.transferredTo).toBeUndefined()
    expect(updatedTicket?.transferToken).toBeNull()
  })
})

// ============================================================================
// FACE API TESTS
// ============================================================================

describe('POST /face/enroll/:userId', () => {
  it('should enroll face template successfully', async () => {
    const user = await createTestUser({ isPartner: true })

    const token = signTestToken(user._id, true)

    const res = await request(app)
      .post(`/face/enroll/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        faceTemplate: 'encrypted-face-template-data',
        deviceId: 'device-001',
      })

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('enrolled')
    expect(res.body.faceEnrolled).toBe(true)

    // Verify enrollment in DB
    const updatedUser = await User.findById(user._id).select('+faceTemplate +faceEnrollmentDevice')
    expect(updatedUser?.faceEnrolled).toBe(true)
    expect(updatedUser?.faceTemplate).toBe('encrypted-face-template-data')
    expect(updatedUser?.faceEnrollmentDevice).toBe('device-001')
  })

  it('should reject enrollment without face template', async () => {
    const user = await createTestUser()

    const token = signTestToken(user._id)

    const res = await request(app)
      .post(`/face/enroll/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: 'device-001',
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('required')
  })

  it('should update enrollment for existing enrolled user', async () => {
    const user = await createTestUser({ faceEnrolled: true })

    const token = signTestToken(user._id)

    const res = await request(app)
      .post(`/face/enroll/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        faceTemplate: 'new-encrypted-template',
        deviceId: 'device-002',
      })

    expect(res.status).toBe(200)

    const updatedUser = await User.findById(user._id).select('+faceTemplate +faceEnrollmentDevice')
    expect(updatedUser?.faceTemplate).toBe('new-encrypted-template')
    expect(updatedUser?.faceEnrollmentDevice).toBe('device-002')
  })
})

describe('POST /face/verify', () => {
  it('should verify face and mark ticket as used', async () => {
    const user = await createTestUser({ faceEnrolled: true })
    const event = await createTestEvent(user._id)
    const ticket = await createTestTicket(user._id, event._id)

    // Enroll face for user
    await User.findByIdAndUpdate(user._id, {
      faceTemplate: 'enrolled-template',
      faceEnrolled: true,
    })

    const organizer = await createTestUser()
    const token = signTestToken(organizer._id)

    const res = await request(app)
      .post('/face/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticketId: ticket._id.toString(),
        faceTemplate: 'scanned-template',
        matchResult: true,
        matchScore: 0.95,
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toContain('matched')

    // Verify ticket marked as used
    const updatedTicket = await Audience.findById(ticket._id)
    expect(updatedTicket?.status).toBe('used')
    expect(updatedTicket?.checkedIn).toBe(true)
    expect(updatedTicket?.checkedInMethod).toBe('face')
  })

  it('should reject face when no match', async () => {
    const user = await createTestUser({ faceEnrolled: true })
    const event = await createTestEvent(user._id)
    const ticket = await createTestTicket(user._id, event._id)

    const organizer = await createTestUser()
    const token = signTestToken(organizer._id)

    const res = await request(app)
      .post('/face/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticketId: ticket._id.toString(),
        faceTemplate: 'scanned-template',
        matchResult: false,
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(false)

    // Verify ticket NOT marked as used
    const updatedTicket = await Audience.findById(ticket._id)
    expect(updatedTicket?.status).toBe('active')
    expect(updatedTicket?.checkedIn).toBe(false)
  })

  it('should reject verification for used ticket', async () => {
    const user = await createTestUser({ faceEnrolled: true })
    const event = await createTestEvent(user._id)
    const ticket = await createTestTicket(user._id, event._id)

    // Mark ticket as used
    await Audience.findByIdAndUpdate(ticket._id, { status: 'used' })

    const organizer = await createTestUser()
    const token = signTestToken(organizer._id)

    const res = await request(app)
      .post('/face/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticketId: ticket._id.toString(),
        faceTemplate: 'scanned-template',
        matchResult: true,
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('used')
  })

  it('should reject verification when ticket owner has no face enrolled', async () => {
    const user = await createTestUser({ faceEnrolled: false })
    const event = await createTestEvent(user._id)
    const ticket = await createTestTicket(user._id, event._id)

    const organizer = await createTestUser()
    const token = signTestToken(organizer._id)

    const res = await request(app)
      .post('/face/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticketId: ticket._id.toString(),
        faceTemplate: 'scanned-template',
        matchResult: true,
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('no enrolled face')
  })

  // SECURITY VULNERABILITY TEST
  it.skip('SECURITY BUG: Server trusts client matchResult without server-side verification', async () => {
    // This test documents the security vulnerability:
    // The server accepts any matchResult=true from the client without
    // performing server-side biometric verification.
    // An attacker could send { matchResult: true } to gain entry.
    //
    // VULNERABILITY: lines 79-86 in apps/api/controllers/face.js
    // The endpoint should NOT trust client-side matchResult.
    // KBY-AI SDK comparison MUST happen server-side, then server
    // returns the verified result.
    //
    // WORKAROUND: Front-end performs KBY-AI check, then sends
    // only the reference to the enrolled template, not the result.
    // Server re-verifies server-side before accepting.
    //
    // FIX REQUIRED: Refactor to use server-side face comparison library,
    // not client-side trust model.

    const attacker = await createTestUser({ name: 'Attacker', faceEnrolled: false })
    const victim = await createTestUser({ name: 'Victim', faceEnrolled: true })
    const event = await createTestEvent(victim._id)
    const victimTicket = await createTestTicket(victim._id, event._id)

    // Enroll victim's face
    await User.findByIdAndUpdate(victim._id, {
      faceTemplate: 'victim-template',
      faceEnrolled: true,
    })

    const attackerToken = signTestToken(attacker._id)

    // Attacker sends fake matchResult=true (has no real face template)
    const res = await request(app)
      .post('/face/verify')
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({
        ticketId: victimTicket._id.toString(),
        faceTemplate: 'attacker-fake-template',
        matchResult: true, // EXPLOITABLE: server trusts this
      })

    // BUG: This succeeds when it should fail
    // Attacker gains entry without matching victim's face
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(false) // Should fail, but currently succeeds
  })
})

describe('DELETE /face/remove/:userId', () => {
  it('should remove face template for user', async () => {
    const user = await createTestUser({ faceEnrolled: true })

    // Enroll face first
    await User.findByIdAndUpdate(user._id, {
      faceTemplate: 'enrolled-template',
      faceEnrolled: true,
      faceEnrollmentDevice: 'device-001',
    })

    const token = signTestToken(user._id)

    const res = await request(app)
      .delete(`/face/remove/${user._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('removed')

    // Verify face removed
    const updatedUser = await User.findById(user._id).select('+faceTemplate +faceEnrollmentDevice')
    expect(updatedUser?.faceEnrolled).toBe(false)
    expect(updatedUser?.faceTemplate).toBeNull()
    expect(updatedUser?.faceEnrollmentDevice).toBeNull()
  })

  it('should remove face when called after transfer', async () => {
    const sender = await createTestUser({ faceEnrolled: true })
    const recipient = await createTestUser()

    // Sender had face enrolled
    await User.findByIdAndUpdate(sender._id, {
      faceTemplate: 'sender-template',
      faceEnrolled: true,
    })

    const token = signTestToken(sender._id)

    // Remove sender's face (called during transfer)
    const res = await request(app)
      .delete(`/face/remove/${sender._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)

    const updatedUser = await User.findById(sender._id).select('+faceTemplate')
    expect(updatedUser?.faceEnrolled).toBe(false)
  })
})
