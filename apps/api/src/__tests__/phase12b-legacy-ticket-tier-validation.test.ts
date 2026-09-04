import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
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
import eventRouter from '../../routes/event.js'

// ============================================================================
// Phase 12B — legacy ticket-tier update validation regression tests
// ============================================================================
//
// The Phase 12A audit found controllers/event.js#updateTicketTier applied
// name/price/capacity straight from the request body with no server-side
// validation at all — negative prices, negative/fractional capacity,
// duplicate tier names, capacity dropped below tickets already sold, and
// price/name changes after real sales had all begun were all silently
// accepted. All are now rejected server-side; sold count is derived from
// real Audience records, mirroring getTicketTierStats.

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
    isPartner: true,
    isAdmin: false,
    referralCode: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...overrides,
  })
  return await user.save()
}

async function createTestEvent(plannerId: string, ticketType: Record<string, unknown>[], overrides: Record<string, unknown> = {}) {
  const event = new Event({
    name: 'test event',
    planner_id: plannerId,
    planner: 'Test Organizer',
    category: 'music',
    description: 'a test event',
    address: 'test venue',
    state: 'lagos',
    status: 'published',
    ticketType,
    ...overrides,
  })
  return await event.save()
}

async function createSoldTicket(eventId: string, tierName: string, overrides: Record<string, unknown> = {}) {
  const ticket = new Audience({
    name: 'Buyer',
    email: 'buyer@example.com',
    event_id: eventId,
    user_id: 'guest',
    eventname: 'test event',
    amount: 1000,
    numOfTicket: 1,
    reference: `REF_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
    type: tierName.toLowerCase(),
    status: 'active',
    ...overrides,
  })
  return await ticket.save()
}

function signOrganizerToken(userId: string | mongoose.Types.ObjectId) {
  return jwt.sign(
    { id: userId.toString(), _id: userId.toString(), email: 'organizer@example.com', isPartner: true, isAdmin: false },
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
  app.use('/events', eventRouter)

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

describe('PUT /events/:id/tiers/:tierId (Phase 12B)', () => {
  it('a valid edit succeeds', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ price: 1500, capacity: 200 })

    expect(res.status).toBe(200)
    expect(res.body.tier.price).toBe(1500)
    expect(res.body.tier.capacity).toBe(200)
  })

  it('rejects a negative price', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ price: -500 })

    expect(res.status).toBe(400)
  })

  it('rejects a non-numeric price', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ price: 'free' })

    expect(res.status).toBe(400)
  })

  it('rejects a negative capacity', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ capacity: -10 })

    expect(res.status).toBe(400)
  })

  it('rejects a fractional capacity', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ capacity: 10.5 })

    expect(res.status).toBe(400)
  })

  it('allows a null capacity (unlimited)', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ capacity: null })

    expect(res.status).toBe(200)
    expect(res.body.tier.capacity).toBeNull()
  })

  it('rejects a duplicate tier name (case-insensitive)', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [
      { name: 'regular', price: 1000, capacity: 100, sold: 0 },
      { name: 'vip', price: 5000, capacity: 20, sold: 0 },
    ])
    const regularTierId = event.ticketType[0]._id!.toString()

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${regularTierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ name: 'VIP' })

    expect(res.status).toBe(409)
  })

  it('rejects reducing capacity below tickets already sold', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()
    await createSoldTicket(event._id.toString(), 'regular')
    await createSoldTicket(event._id.toString(), 'regular')
    await createSoldTicket(event._id.toString(), 'regular')

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ capacity: 2 })

    expect(res.status).toBe(400)
  })

  it('allows increasing capacity above the sold count', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()
    await createSoldTicket(event._id.toString(), 'regular')

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ capacity: 500 })

    expect(res.status).toBe(200)
    expect(res.body.tier.capacity).toBe(500)
  })

  it('rejects a price change after sales have begun for this tier', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()
    await createSoldTicket(event._id.toString(), 'regular')

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ price: 2000 })

    expect(res.status).toBe(400)
  })

  it('rejects a rename after sales have begun for this tier', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()
    await createSoldTicket(event._id.toString(), 'regular')

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ name: 'premium' })

    expect(res.status).toBe(400)
  })

  it('allows re-submitting the same price/name once sales have begun (no actual change)', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()
    await createSoldTicket(event._id.toString(), 'regular')

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ name: 'regular', price: 1000, capacity: 200 })

    expect(res.status).toBe(200)
  })

  it('a non-owning organizer cannot edit another organizer\'s tier', async () => {
    const owner = await createTestUser()
    const stranger = await createTestUser()
    const event = await createTestEvent(owner._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(stranger._id)}`)
      .send({ price: 1 })

    expect(res.status).toBe(403)
  })

  it('refunded tickets do not count toward the sold floor', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }])
    const tierId = event.ticketType[0]._id!.toString()
    await createSoldTicket(event._id.toString(), 'regular', { status: 'refunded' })

    const res = await request(app)
      .put(`/events/${event._id.toString()}/tiers/${tierId}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ capacity: 1, price: 5000 })

    expect(res.status).toBe(200)
  })
})
