import 'dotenv/config';
import mongoose from 'mongoose';
import { generateSecret } from 'otplib';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Audience from '../models/Audience.js';
import Notification from '../models/Notification.js';
import Follow from '../models/Follow.js';
import EventLike from '../models/EventLike.js';
import Wallet from '../models/Wallet.js';
import { QR } from '../utils/QRCode.js';

// ─────────────────────────────────────────────────────────────
// Gives Amaka Eze (the demo attendee from seed-demo-users.js)
// real activity to design against: tickets (upcoming + past,
// checked-in), notifications/inbox, followed organizers, and
// saved events. Run seed-demo-users.js first — this script
// looks up Amaka + Kemi + Chidi + their events by the exact
// values that script creates.
// ─────────────────────────────────────────────────────────────

await mongoose.connect(process.env.MONGO);
console.log('✓ Connected to MongoDB');

try {
  const amaka = await User.findOne({ email: 'amaka.eze@comfytag.dev' });
  const kemi = await User.findOne({ email: 'kemi.adeyemi@comfytag.dev' });
  const chidi = await User.findOne({ email: 'chidi.okafor@comfytag.dev' });

  if (!amaka || !kemi || !chidi) {
    console.error('❌ Amaka/Kemi/Chidi not found — run `node scripts/seed-demo-users.js` first.');
    process.exit(1);
  }

  const findEvent = async (planner_id, name) => {
    const event = await Event.findOne({ planner_id: planner_id.toString(), name: name.toLowerCase() });
    if (!event) throw new Error(`Event not found: "${name}" — run seed-demo-users.js first.`);
    return event;
  };

  const sunset = await findEvent(kemi._id, 'Sunset Sessions Lagos');
  const amapiano = await findEvent(kemi._id, 'Amapiano Fridays Vol. 7');
  const highlife = await findEvent(kemi._id, 'Highlife Revival Night');
  const nye = await findEvent(kemi._id, "New Year's Eve Countdown Lagos");
  const techSummit = await findEvent(chidi._id, 'Abuja Tech Founders Summit 2026');
  const designBootcamp = await findEvent(chidi._id, 'Product Design Bootcamp');
  const pitchNight = await findEvent(chidi._id, 'Startup Pitch Night: Series A Ready');
  const devConf = await findEvent(chidi._id, 'DevConf Abuja 2026');

  // ─── Tickets (Audience) ────────────────────────────────────
  console.log('\n🎟️  Upserting tickets for Amaka...');

  const ticketTemplates = [
    // Upcoming, active
    { event: sunset, type: 'VIP Rooftop Cabana', numOfTicket: 1, status: 'active', checkedIn: false },
    { event: amapiano, type: 'General', numOfTicket: 2, status: 'active', checkedIn: false },
    { event: designBootcamp, type: 'Standard', numOfTicket: 1, status: 'active', checkedIn: false },
    { event: techSummit, type: 'Startup Pass', numOfTicket: 1, status: 'active', checkedIn: false },
    // Past, checked in
    {
      event: nye,
      type: 'Standard',
      numOfTicket: 1,
      status: 'used',
      checkedIn: true,
      checkedInAt: new Date('2025-12-31T20:45:00Z'),
    },
    {
      event: devConf,
      type: 'Workshop Pass',
      numOfTicket: 1,
      status: 'used',
      checkedIn: true,
      checkedInAt: new Date('2026-05-14T08:20:00Z'),
    },
  ];

  const savedTickets = [];
  let ticketNumberSeed = await Audience.countDocuments({});

  for (const tpl of ticketTemplates) {
    const tier = tpl.event.ticketType.find((t) => t.name === tpl.type);
    if (!tier) throw new Error(`Ticket tier "${tpl.type}" not found on "${tpl.event.name}"`);

    const amount = tier.price === 0 ? 0 : Math.round(tier.price * tpl.numOfTicket * 1.05);
    const reference = `SEED_${tpl.event._id.toString().slice(-6).toUpperCase()}_${amaka._id.toString().slice(-6).toUpperCase()}`;

    const existing = await Audience.findOne({ event_id: tpl.event._id.toString(), user_id: amaka._id.toString(), type: tpl.type.toLowerCase() });
    if (existing) {
      savedTickets.push(existing);
      console.log(`  · already exists: ${tpl.event.name} (${tpl.type})`);
      continue;
    }

    let qrCode = null;
    try {
      qrCode = await QR(reference);
    } catch {
      qrCode = null;
    }

    ticketNumberSeed += 1;

    const ticket = await new Audience({
      name: amaka.name,
      email: amaka.email,
      phone: amaka.phone,
      event_id: tpl.event._id.toString(),
      user_id: amaka._id.toString(),
      eventname: tpl.event.name,
      amount,
      isFreeTicket: tier.price === 0,
      numOfTicket: tpl.numOfTicket,
      type: tpl.type.toLowerCase(),
      reference,
      status: tpl.status,
      checkedIn: tpl.checkedIn,
      checkedInAt: tpl.checkedInAt ?? null,
      checkedInMethod: tpl.checkedIn ? 'face' : null,
      ticketNumber: ticketNumberSeed,
      qrCode,
      totpSecret: generateSecret(),
      date: tpl.checkedInAt ?? new Date(),
    }).save();

    savedTickets.push(ticket);
    console.log(`  ✓ ${tpl.event.name} (${tpl.type}) — ${tpl.status}`);
  }

  // ─── Follows ────────────────────────────────────────────────
  console.log('\n👥 Following organizers...');
  for (const organizer of [kemi, chidi]) {
    await Follow.findOneAndUpdate(
      { follower_id: amaka._id.toString(), organizer_id: organizer._id.toString() },
      { follower_id: amaka._id.toString(), organizer_id: organizer._id.toString() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓ following ${organizer.name}`);
  }

  // ─── Saved / liked events ──────────────────────────────────
  console.log('\n❤️  Saving events...');
  for (const event of [sunset, pitchNight, highlife]) {
    await EventLike.findOneAndUpdate(
      { user_id: amaka._id.toString(), event_id: event._id.toString() },
      { user_id: amaka._id.toString(), event_id: event._id.toString() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓ saved ${event.name}`);
  }

  // ─── Wallet ─────────────────────────────────────────────────
  console.log('\n💰 Seeding wallet...');
  await Wallet.findOneAndUpdate(
    { user_id: amaka._id.toString() },
    {
      user_id: amaka._id.toString(),
      balance: 1500,
      transactions: [
        { type: 'credit', amount: 1000, reason: 'Referral conversion', referenceId: savedTickets[0]?._id?.toString() ?? 'seed', createdAt: new Date('2026-07-20') },
        { type: 'credit', amount: 500, reason: 'Referral conversion', referenceId: savedTickets[1]?._id?.toString() ?? 'seed', createdAt: new Date('2026-08-01') },
      ],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('  ✓ wallet balance ₦1,500 with 2 transactions');

  // ─── Notifications (inbox) ─────────────────────────────────
  console.log('\n🔔 Seeding inbox notifications...');

  const notifications = [
    {
      type: 'ticket_confirmed',
      title: 'Ticket confirmed 🎉',
      message: `Your ticket for ${sunset.name} is ready. See you there!`,
      data: { ticketId: savedTickets[0]?._id?.toString(), eventId: sunset._id.toString() },
      read: false,
      createdAt: new Date('2026-08-07T09:00:00Z'),
    },
    {
      type: 'ticket_confirmed',
      title: 'Ticket confirmed 🎉',
      message: `Your 2 tickets for ${amapiano.name} are ready. See you there!`,
      data: { ticketId: savedTickets[1]?._id?.toString(), eventId: amapiano._id.toString() },
      read: false,
      createdAt: new Date('2026-08-06T14:30:00Z'),
    },
    {
      type: 'event_reminder',
      title: `${designBootcamp.name} is coming up`,
      message: `Your event starts on ${designBootcamp.event_date.toDateString()}. Don't forget to enroll your face for check-in.`,
      data: { ticketId: savedTickets[2]?._id?.toString(), eventId: designBootcamp._id.toString() },
      read: false,
      createdAt: new Date('2026-08-08T08:00:00Z'),
    },
    {
      type: 'ticket_confirmed',
      title: 'Ticket confirmed 🎉',
      message: `Your ticket for ${techSummit.name} is ready. See you there!`,
      data: { ticketId: savedTickets[3]?._id?.toString(), eventId: techSummit._id.toString() },
      read: true,
      createdAt: new Date('2026-07-28T11:15:00Z'),
    },
    {
      type: 'new_event_from_following',
      title: `${kemi.name} just published a new event`,
      message: `${highlife.name} is now live — grab your ticket before it sells out.`,
      data: { eventId: highlife._id.toString() },
      read: true,
      createdAt: new Date('2026-07-15T10:00:00Z'),
    },
    {
      type: 'face_enrolled',
      title: 'Face enrollment complete ✓',
      message: 'Your face is now your ticket — no more QR codes needed at check-in.',
      data: {},
      read: true,
      createdAt: amaka.faceEnrolledAt ?? new Date('2026-06-01T14:00:00Z'),
    },
    {
      type: 'ticket_confirmed',
      title: 'Ticket confirmed 🎉',
      message: `Your ticket for ${devConf.name} is ready. See you there!`,
      data: { ticketId: savedTickets[5]?._id?.toString(), eventId: devConf._id.toString() },
      read: true,
      createdAt: new Date('2026-05-10T09:00:00Z'),
    },
    {
      type: 'ticket_confirmed',
      title: 'Ticket confirmed 🎉',
      message: `Your ticket for ${nye.name} is ready. See you there!`,
      data: { ticketId: savedTickets[4]?._id?.toString(), eventId: nye._id.toString() },
      read: true,
      createdAt: new Date('2025-12-28T09:00:00Z'),
    },
  ];

  for (const n of notifications) {
    const exists = await Notification.findOne({
      user_id: amaka._id.toString(),
      type: n.type,
      'data.eventId': n.data.eventId ?? null,
    });
    if (exists) {
      console.log(`  · already exists: ${n.title}`);
      continue;
    }
    const created = await Notification.create({ user_id: amaka._id.toString(), ...n });
    // createdAt is timestamps-managed; overwrite directly so the inbox reads chronologically.
    await Notification.updateOne({ _id: created._id }, { $set: { createdAt: n.createdAt } });
    console.log(`  ✓ ${n.title}`);
  }

  console.log('\n✅ Amaka activity seed completed!');
  console.log('\n📊 Summary:');
  console.log(`  • ${savedTickets.length} tickets (4 upcoming, 2 past/checked-in)`);
  console.log('  • Following 2 organizers (Kemi Adeyemi, Chidi Okafor)');
  console.log('  • 3 saved/liked events');
  console.log('  • Wallet balance ₦1,500');
  console.log(`  • ${notifications.length} inbox notifications (3 unread)`);
  console.log('\n🔐 Login: amaka.eze@comfytag.dev | AmakaPass123!\n');
} catch (error) {
  console.error('❌ Seed failed:', error);
  process.exit(1);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB\n');
}
