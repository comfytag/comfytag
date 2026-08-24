import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Event from '../models/Event.js';
import { generateReferralCode, generateFallbackCode } from '../utils/referralCode.js';

function toSlug(name) {
  const base = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─────────────────────────────────────────────────────────────
// 3 users: 2 active partners (organizers) + 1 regular attendee
// ─────────────────────────────────────────────────────────────
const users = [
  {
    username: 'kemiadeyemi',
    name: 'Kemi Adeyemi',
    email: 'kemi.adeyemi@comfytag.dev',
    password: 'KemiPass123!',
    businessName: 'Adeyemi Live Productions',
    phone: '+2348021234567',
    isPartner: true,
    premium: true,
    address: '14 Bourdillon Road, Ikoyi, Lagos',
    image: 'https://i.pravatar.cc/300?img=47',
    avatar: 'https://i.pravatar.cc/300?img=47',
    bgImg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200',
    verify: {
      photo: 'https://i.pravatar.cc/300?img=47',
      idType: 'nin',
      idDocument: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800',
    },
    isVerify: { email: true },
    onboarding: {
      experience: '3-5 years',
      team: '2-5 people',
      event_per_year: '10-20',
      event_turnout: '500-1000',
      interest: ['music', 'nightlife', 'entertainment'],
      completed: true,
    },
    kycStatus: 'verified',
    faceEnrolled: true,
    faceEnrolledAt: new Date('2026-05-02T10:15:00Z'),
    faceTemplate: 'mock_encrypted_face_template_kemi_base64',
    faceEnrollmentDevice: 'iPhone 15 Pro (mock enrollment)',
    notificationPreferences: { email: true, sms: true },
    privacySettings: { publicProfile: true, showInSearch: true },
  },
  {
    username: 'chidiokafor',
    name: 'Chidi Okafor',
    email: 'chidi.okafor@comfytag.dev',
    password: 'ChidiPass123!',
    businessName: 'Okafor Innovations Hub',
    phone: '+2348034567890',
    isPartner: true,
    premium: true,
    address: '15 Aguiyi Ironsi Street, Maitama, Abuja',
    image: 'https://i.pravatar.cc/300?img=12',
    avatar: 'https://i.pravatar.cc/300?img=12',
    bgImg: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
    verify: {
      photo: 'https://i.pravatar.cc/300?img=12',
      idType: 'passport',
      idDocument: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    },
    isVerify: { email: true },
    onboarding: {
      experience: '5+ years',
      team: '6-10 people',
      event_per_year: '20+',
      event_turnout: '1000+',
      interest: ['tech', 'business', 'networking'],
      completed: true,
    },
    kycStatus: 'verified',
    faceEnrolled: true,
    faceEnrolledAt: new Date('2026-04-18T09:30:00Z'),
    faceTemplate: 'mock_encrypted_face_template_chidi_base64',
    faceEnrollmentDevice: 'Samsung Galaxy S24 (mock enrollment)',
    notificationPreferences: { email: true, sms: false },
    privacySettings: { publicProfile: true, showInSearch: true },
  },
  {
    username: 'amakaeze',
    name: 'Amaka Eze',
    email: 'amaka.eze@comfytag.dev',
    password: 'AmakaPass123!',
    phone: '+2348059876543',
    isPartner: false,
    premium: false,
    address: '22 Ademola Adetokunbo Crescent, Wuse II, Abuja',
    image: 'https://i.pravatar.cc/300?img=32',
    avatar: 'https://i.pravatar.cc/300?img=32',
    bgImg: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
    verify: {
      photo: 'https://i.pravatar.cc/300?img=32',
      idType: 'voters_card',
      idDocument: 'https://images.unsplash.com/photo-1586880244386-8b3e34c8382c?w=800',
    },
    isVerify: { email: true },
    onboarding: {
      experience: '',
      team: '',
      event_per_year: '',
      event_turnout: '',
      interest: ['music', 'comedy', 'food & drinks'],
      completed: true,
    },
    kycStatus: 'verified',
    faceEnrolled: true,
    faceEnrolledAt: new Date('2026-06-01T14:00:00Z'),
    faceTemplate: 'mock_encrypted_face_template_amaka_base64',
    faceEnrollmentDevice: 'Google Pixel 8 (mock enrollment)',
    notificationPreferences: { email: true, sms: true },
    privacySettings: { publicProfile: true, showInSearch: false },
  },
];

// ─────────────────────────────────────────────────────────────
// 5 fully-detailed events per partner (Kemi = index 0, Chidi = index 1)
// ─────────────────────────────────────────────────────────────
const eventTemplates = [
  // ── Kemi Adeyemi — Music & Nightlife, Lagos ──
  {
    userIndex: 0,
    name: 'Sunset Sessions Lagos',
    category: 'Music',
    secondaryCategory: 'Nightlife',
    headline: "Lagos' most anticipated rooftop sunset party returns for one more round.",
    description:
      'A curated rooftop experience blending live Afrobeats performances, a world-class DJ lineup, and panoramic views of Victoria Island as the sun goes down. Expect premium cocktails, a chef-curated small-plates menu, and surprise guest performances.',
    venue: 'The Rooftop, Eko Hotel Towers',
    address: '1415 Adetokunbo Ademola Street, Victoria Island',
    location: 'Victoria Island',
    state: 'lagos',
    startTime: '17:00',
    endTime: '23:00',
    event_date: new Date('2026-09-06'),
    ticket_end: new Date('2026-09-04'),
    status: 'published',
    featured: true,
    pick: true,
    ticketType: [
      { name: 'Early Bird', price: 6000, capacity: 150, sold: 142 },
      { name: 'Regular', price: 10000, capacity: 250, sold: 168 },
      { name: 'VIP Rooftop Cabana', price: 30000, capacity: 40, sold: 22 },
    ],
    gateRules: ['Valid ID required at entry', 'Smart casual dress code', 'No outside food or drinks'],
    images: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    ],
    promos: [
      { code: 'SUNSET10', discountType: 'percentage', discountValue: 10, maxUses: 100, usedCount: 34, expiresAt: new Date('2026-09-03'), isActive: true },
    ],
  },
  {
    userIndex: 0,
    name: 'Amapiano Fridays Vol. 7',
    category: 'Music',
    secondaryCategory: 'Nightlife',
    headline: 'The log drum takes over Lekki for one unforgettable Friday night.',
    description:
      'Nigeria\'s longest-running Amapiano series is back with resident DJs and a special guest set from South Africa. Two dance floors, a dedicated chill lounge, and late-night street food vendors on site.',
    venue: 'Landmark Event Centre',
    address: '3-5 Water Corporation Road, Oniru, Lekki',
    location: 'Lekki',
    state: 'lagos',
    startTime: '21:00',
    endTime: '04:00',
    event_date: new Date('2026-08-28'),
    ticket_end: new Date('2026-08-27'),
    status: 'published',
    featured: false,
    pick: false,
    ticketType: [
      { name: 'General', price: 4000, capacity: 400, sold: 261 },
      { name: 'VIP', price: 12000, capacity: 80, sold: 47 },
    ],
    gateRules: ['18+ event, valid ID mandatory', 'Cashless payment only at bar', 'Re-entry not permitted'],
    images: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      'https://images.unsplash.com/photo-1571266752333-2fdaa8be9c1c?w=800',
    ],
    promos: [
      { code: 'PIANO20', discountType: 'fixed', discountValue: 1000, maxUses: 200, usedCount: 88, expiresAt: new Date('2026-08-27'), isActive: true },
    ],
  },
  {
    userIndex: 0,
    name: 'Highlife Revival Night',
    category: 'Music',
    secondaryCategory: 'Culture',
    headline: 'A live band tribute to the golden age of Nigerian highlife.',
    description:
      'An intimate evening celebrating highlife legends with a 12-piece live band, guest vocalists, and archival visuals projected throughout the night. Seated and standing sections available.',
    venue: 'Blue Note Jazz Club',
    address: '23 Sobo Arobiodu Street, Ikoyi',
    location: 'Ikoyi',
    state: 'lagos',
    startTime: '19:30',
    endTime: '23:00',
    event_date: new Date('2026-08-15'),
    ticket_end: new Date('2026-08-13'),
    status: 'published',
    featured: false,
    pick: false,
    ticketType: [
      { name: 'Standing', price: 3500, capacity: 200, sold: 133 },
      { name: 'Seated', price: 8000, capacity: 60, sold: 51 },
    ],
    gateRules: ['Semi-formal attire', 'Doors open 30 minutes before start', 'Quiet please during live sets'],
    images: [
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    ],
    promos: [],
  },
  {
    userIndex: 0,
    name: 'Lagos Live Unplugged',
    category: 'Music',
    secondaryCategory: 'Arts & Culture',
    headline: 'Acoustic sets from Lagos\' rising singer-songwriters, stripped back and up close.',
    description:
      'A cozy, unplugged evening featuring four emerging singer-songwriters performing acoustic sets in a listening-room setting. Limited seating for an intimate atmosphere.',
    venue: 'The Creative Space',
    address: '45 Awolowo Road, Ikoyi',
    location: 'Ikoyi',
    state: 'lagos',
    startTime: '19:00',
    endTime: '22:00',
    event_date: new Date('2026-09-20'),
    ticket_end: new Date('2026-09-19'),
    status: 'draft',
    featured: false,
    pick: false,
    ticketType: [
      { name: 'General Admission', price: 2500, capacity: 120, sold: 0 },
      { name: 'Front Row', price: 6000, capacity: 20, sold: 0 },
    ],
    gateRules: ['Seating is first-come, first-served', 'No recording during performances', 'Support local artists'],
    images: [
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
    ],
    promos: [],
  },
  {
    userIndex: 0,
    name: "New Year's Eve Countdown Lagos",
    category: 'Nightlife',
    secondaryCategory: 'Music',
    headline: 'Lagos rang in the new year in style — relive the highlights.',
    description:
      'The city\'s premier countdown party featuring three stages, a midnight fireworks display over the lagoon, and headline sets from top Nigerian DJs. Fine dining, premium bars, and a dedicated VIP deck.',
    venue: 'Signature Event Centre',
    address: '14 Kilo, Ikoyi',
    location: 'Ikoyi',
    state: 'lagos',
    startTime: '20:00',
    endTime: '05:00',
    event_date: new Date('2025-12-31'),
    ticket_end: new Date('2025-12-30'),
    status: 'ended',
    featured: false,
    pick: false,
    ticketType: [
      { name: 'Standard', price: 10000, capacity: 500, sold: 500 },
      { name: 'VIP Deck', price: 45000, capacity: 60, sold: 60 },
    ],
    gateRules: ['Valid ID required', 'No outside drinks', 'Fireworks viewing from VIP deck only'],
    images: [
      'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=comfytag-nye-recap',
    recapPhotos: [
      'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800',
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    ],
    promos: [],
  },

  // ── Chidi Okafor — Tech & Business, Abuja ──
  {
    userIndex: 1,
    name: 'Abuja Tech Founders Summit 2026',
    category: 'Tech',
    secondaryCategory: 'Business',
    headline: 'Where Abuja\'s boldest founders meet the investors backing the next wave.',
    description:
      'A full-day summit bringing together startup founders, VCs, and policymakers to discuss the future of Nigerian tech. Keynotes, investor pitch sessions, and structured networking blocks throughout the day.',
    venue: 'Nicon Hilton Abuja',
    address: '123 Mohammed Maitama Sule Street, Central Business District',
    location: 'CBD',
    state: 'abuja',
    startTime: '08:00',
    endTime: '18:00',
    event_date: new Date('2026-10-10'),
    ticket_end: new Date('2026-10-05'),
    status: 'published',
    featured: true,
    pick: true,
    ticketType: [
      { name: 'General', price: 15000, capacity: 500, sold: 312 },
      { name: 'Startup Pass', price: 30000, capacity: 100, sold: 64 },
      { name: 'Investor / Sponsor', price: 150000, capacity: 15, sold: 9 },
    ],
    gateRules: ['Professional attire required', 'Badge must be worn at all times', 'Networking dinner included for Investor pass'],
    images: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      'https://images.unsplash.com/photo-1460925895917-aeb19be489c7?w=800',
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800',
    ],
    promos: [
      { code: 'FOUNDER25', discountType: 'percentage', discountValue: 25, maxUses: 50, usedCount: 19, expiresAt: new Date('2026-10-01'), isActive: true },
    ],
  },
  {
    userIndex: 1,
    name: 'Product Design Bootcamp',
    category: 'Tech',
    secondaryCategory: 'Education',
    headline: 'Two intensive days turning designers into product-thinking powerhouses.',
    description:
      'A hands-on bootcamp covering product strategy, UX research methods, and design systems, led by senior product designers from leading African tech companies. Includes a live portfolio review session.',
    venue: 'Innovation Hub Africa',
    address: '456 Kumasi Crescent, Maitama',
    location: 'Maitama',
    state: 'abuja',
    startTime: '09:00',
    endTime: '17:00',
    event_date: new Date('2026-08-22'),
    ticket_end: new Date('2026-08-18'),
    status: 'published',
    featured: false,
    pick: false,
    ticketType: [
      { name: 'Standard', price: 20000, capacity: 80, sold: 57 },
      { name: 'Student', price: 8000, capacity: 40, sold: 31 },
    ],
    gateRules: ['Laptop required', 'Lunch and refreshments included', 'Certificate issued on completion'],
    images: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    ],
    promos: [
      { code: 'DESIGN15', discountType: 'percentage', discountValue: 15, maxUses: 60, usedCount: 22, expiresAt: new Date('2026-08-17'), isActive: true },
    ],
  },
  {
    userIndex: 1,
    name: 'Startup Pitch Night: Series A Ready',
    category: 'Business',
    secondaryCategory: 'Tech',
    headline: 'Eight founders. Five minutes each. One shot at the room.',
    description:
      'A high-energy pitch competition featuring eight pre-vetted startups pitching to a panel of active investors, followed by open networking. Winner receives a guaranteed follow-up meeting with three VC firms.',
    venue: 'Transcorp Hilton Abuja',
    address: '789 Eko Boulevard, Central Business District',
    location: 'CBD',
    state: 'abuja',
    startTime: '17:00',
    endTime: '21:00',
    event_date: new Date('2026-09-05'),
    ticket_end: new Date('2026-09-04'),
    status: 'published',
    featured: false,
    pick: false,
    ticketType: [
      { name: 'Attendee', price: 5000, capacity: 300, sold: 178 },
      { name: 'VIP + Networking Cocktail', price: 18000, capacity: 50, sold: 33 },
    ],
    gateRules: ['Business casual attire', 'Investor badges checked at entry', 'Pitch deck submissions closed'],
    images: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800',
    ],
    promos: [],
  },
  {
    userIndex: 1,
    name: 'Women Who Code Abuja',
    category: 'Tech',
    secondaryCategory: 'Community',
    headline: 'A full-day gathering for women building in tech — code, careers, and community.',
    description:
      'Workshops on frontend engineering and cloud infrastructure, a mentorship speed-networking session, and a panel on navigating leadership in tech. Open to all skill levels.',
    venue: 'Tech Learning Center Abuja',
    address: '321 Diplomatic Drive, Maitama',
    location: 'Maitama',
    state: 'abuja',
    startTime: '09:00',
    endTime: '16:00',
    event_date: new Date('2026-09-25'),
    ticket_end: new Date('2026-09-23'),
    status: 'draft',
    featured: false,
    pick: false,
    ticketType: [
      { name: 'Free', price: 0, capacity: 250, sold: 0 },
      { name: 'VIP Mentorship Track', price: 5000, capacity: 40, sold: 0 },
    ],
    gateRules: ['Open to all genders', 'Laptop recommended for workshops', 'Lunch provided'],
    images: [
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800',
    ],
    promos: [],
  },
  {
    userIndex: 1,
    name: 'DevConf Abuja 2026',
    category: 'Tech',
    secondaryCategory: 'Community',
    headline: 'Abuja\'s developer community showed up in force — here\'s the recap.',
    description:
      'A community-run developer conference featuring lightning talks, live code labs, and an open-source contribution sprint. This year drew the largest crowd yet, with tracks on AI, mobile, and cloud infrastructure.',
    venue: 'Federal Palace Hotel Abuja',
    address: '555 Aminu Kano Crescent, Wuse',
    location: 'Wuse',
    state: 'abuja',
    startTime: '08:00',
    endTime: '18:00',
    event_date: new Date('2026-05-14'),
    ticket_end: new Date('2026-05-10'),
    status: 'ended',
    featured: false,
    pick: false,
    ticketType: [
      { name: 'General (Free)', price: 0, capacity: 600, sold: 600 },
      { name: 'Workshop Pass', price: 3000, capacity: 150, sold: 141 },
    ],
    gateRules: ['Open to all developers', 'Free swag while supplies last', 'Food and beverages included'],
    images: [
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=comfytag-devconf-recap',
    recapPhotos: [
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    ],
    promos: [],
  },
];

await mongoose.connect(process.env.MONGO);
console.log('✓ Connected to MongoDB');

try {
  console.log('\n📝 Upserting 3 users...');
  const savedUsers = [];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    let saved = null;
    for (let attempt = 0; attempt < 5 && !saved; attempt++) {
      try {
        const existing = await User.findOne({ email: userData.email });
        const payload = {
          ...userData,
          password: hashedPassword,
          isVerify: userData.isVerify,
          referralCode: existing?.referralCode || generateReferralCode(userData.username, userData.name),
        };
        saved = await User.findOneAndUpdate(
          { email: userData.email },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        if (err.code === 11000 && err.keyPattern?.referralCode) continue;
        throw err;
      }
    }

    if (!saved.referralFallbackCode) {
      saved.referralFallbackCode = generateFallbackCode(saved._id);
      await saved.save();
    }

    savedUsers.push(saved);
    console.log(`  ✓ ${userData.username} (${userData.email}) — partner: ${userData.isPartner}`);
  }

  console.log('\n🎟️  Upserting 10 events (5 per partner)...');
  const eventIdsByUser = { 0: [], 1: [] };

  for (const tpl of eventTemplates) {
    const organizer = savedUsers[tpl.userIndex];

    const eventData = {
      name: tpl.name.toLowerCase(),
      planner_id: organizer._id.toString(),
      planner: organizer.username,
      category: tpl.category,
      secondaryCategory: tpl.secondaryCategory || '',
      description: tpl.description,
      headline: tpl.headline || '',
      date: tpl.event_date,
      event_date: tpl.event_date,
      ticket_end: tpl.ticket_end,
      venue: tpl.venue.toLowerCase(),
      startTime: tpl.startTime,
      endTime: tpl.endTime,
      status: tpl.status,
      featured: tpl.featured || false,
      pick: tpl.pick || false,
      images: tpl.images,
      address: tpl.address.toLowerCase(),
      location: tpl.location.toLowerCase(),
      state: tpl.state.toLowerCase(),
      videoUrl: tpl.videoUrl || '',
      recapPhotos: tpl.recapPhotos || [],
      gateRules: tpl.gateRules,
      ticketType: tpl.ticketType,
      promos: tpl.promos || [],
      sold: tpl.ticketType.reduce((sum, tt) => sum + (tt.sold || 0), 0),
      totalCapacity: tpl.ticketType.reduce((sum, tt) => sum + (tt.capacity || 0), 0),
      slug: toSlug(tpl.name),
    };

    const saved = await Event.findOneAndUpdate(
      { planner_id: eventData.planner_id, name: eventData.name },
      eventData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    eventIdsByUser[tpl.userIndex].push(saved._id);
    console.log(`  ✓ [${organizer.username}] ${tpl.name} (${tpl.status})`);
  }

  // Keep User.events in sync, mirroring what createEvent() does on real creation
  for (const idx of [0, 1]) {
    const organizer = savedUsers[idx];
    const existingIds = new Set((organizer.events || []).map(String));
    for (const id of eventIdsByUser[idx]) existingIds.add(String(id));
    await User.findByIdAndUpdate(organizer._id, { events: Array.from(existingIds) });
  }

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  • 3 users upserted (2 active partners, 1 regular attendee)');
  console.log('  • 10 events upserted (5 per partner: 3 published, 1 draft, 1 ended each)');
  console.log('  • All profile fields populated (verification, KYC, face enrollment, onboarding, preferences)');
  console.log('  • All event fields populated (categories, ticket tiers, promos, gate rules, images, recap media)');
  console.log('\n🔐 Credentials:');
  console.log('  Partner  | Kemi Adeyemi  | kemi.adeyemi@comfytag.dev  | KemiPass123!');
  console.log('  Partner  | Chidi Okafor  | chidi.okafor@comfytag.dev | ChidiPass123!');
  console.log('  Attendee | Amaka Eze     | amaka.eze@comfytag.dev    | AmakaPass123!\n');
} catch (error) {
  console.error('❌ Seed failed:', error);
  process.exit(1);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB\n');
}
