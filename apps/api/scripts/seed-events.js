import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Event from '../models/Event.js';

// Helper to generate slug
function generateSlug(name) {
  const base = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

// 4 Organizers
const organizers = [
  {
    username: 'testpartner',
    name: 'Test Partner',
    email: 'partner@comfytag.dev',
    password: 'TestPass123!',
    businessName: 'Afro Nights Entertainment',
    isPartner: true,
    isAdmin: false,
    isVerify: { email: true, photo: true, idCard: true, address: true },
    premium: true,
  },
  {
    username: 'techhubnig',
    name: 'Tech Hub Nigeria',
    email: 'tech@comfytag.dev',
    password: 'TechPass123!',
    businessName: 'Tech Hub Nigeria Ltd',
    isPartner: true,
    isAdmin: false,
    isVerify: { email: true, photo: true, idCard: true, address: true },
    premium: true,
  },
  {
    username: 'naijavibes',
    name: 'Naija Vibes',
    email: 'vibes@comfytag.dev',
    password: 'VibesPass123!',
    businessName: 'Naija Vibes Collective',
    isPartner: true,
    isAdmin: false,
    isVerify: { email: true, photo: true, idCard: true, address: true },
    premium: true,
  },
  {
    username: 'activelagos',
    name: 'Active Lagos',
    email: 'active@comfytag.dev',
    password: 'ActivePass123!',
    businessName: 'Active Lagos Sports Co',
    isPartner: true,
    isAdmin: false,
    isVerify: { email: true, photo: true, idCard: true, address: true },
    premium: true,
  },
];

// 20 Events - 5 per organizer
const eventTemplates = [
  // Organizer 0: testpartner - Music & Nightlife, Lagos
  {
    organizerIndex: 0,
    name: 'AfroNight Lagos Vol. 3',
    category: 'Music',
    description:
      'Experience the biggest Afrobeats night in Lagos with live performances from top Nigerian artists. VIP tables include bottle service and reserved seating.',
    address: '14 kilo, ikoyi',
    venue: 'Signature Event Centre',
    location: 'Ikoyi',
    state: 'lagos',
    startTime: '22:00',
    endTime: '04:00',
    event_date: new Date('2026-07-12'),
    ticket_end: new Date('2026-07-09'),
    status: 'published',
    featured: true,
    ticketType: [
      { name: 'General', price: 5000, capacity: 300, sold: 180 },
      { name: 'VIP', price: 15000, capacity: 80, sold: 65 },
      { name: 'VVIP', price: 35000, capacity: 20, sold: 18 },
    ],
    gateRules: ['Valid ID required', 'No outside drinks', 'Doors close at 2am'],
    images: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    ],
  },
  {
    organizerIndex: 0,
    name: 'Lagos Beach Rave 2026',
    category: 'Music',
    description:
      'Sunset to sunrise beach rave on the pristine shores of Lekki. Multiple DJ stages, beach volleyball, and bonfire vibes.',
    address: 'Lekki beach, lekki',
    venue: 'Lekki Beach',
    location: 'Lekki',
    state: 'lagos',
    startTime: '18:00',
    endTime: '06:00',
    event_date: new Date('2026-08-02'),
    ticket_end: new Date('2026-07-30'),
    status: 'published',
    ticketType: [
      { name: 'Early Bird', price: 3500, capacity: 200, sold: 120 },
      { name: 'Regular', price: 6000, capacity: 300, sold: 250 },
      { name: 'VIP', price: 12000, capacity: 100, sold: 85 },
    ],
    gateRules: ['Swimwear recommended', 'Cashless payment only', 'Security check at entrance'],
    images: [
      'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=800',
      'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=800',
    ],
  },
  {
    organizerIndex: 0,
    name: 'Detty December Kickoff Party',
    category: 'Nightlife',
    description:
      'Kick off the festive season with our signature year-end bash. Fine dining, premium cocktails, and A-list entertainment.',
    address: '1 admiralty way, lekki',
    venue: 'Premium Loft Lekki',
    location: 'Lekki',
    state: 'lagos',
    startTime: '20:00',
    endTime: '05:00',
    event_date: new Date('2026-12-05'),
    ticket_end: new Date('2026-12-02'),
    status: 'published',
    pick: true,
    ticketType: [
      { name: 'Standard', price: 8000, capacity: 400, sold: 320 },
      { name: 'VIP Table', price: 50000, capacity: 20, sold: 16 },
    ],
    gateRules: ['Smart casual attire', 'Reservation required for VIP tables', 'Valid invitation at door'],
    images: [
      'https://images.unsplash.com/photo-1520763185298-1b434c919abe?w=800',
      'https://images.unsplash.com/photo-1503164991455-77f0e17a0435?w=800',
    ],
  },
  {
    organizerIndex: 0,
    name: 'Naija Jazz Evening',
    category: 'Music',
    description:
      'An intimate evening of smooth Nigerian jazz with live band performances. Perfect for date night or with friends.',
    address: '23 sobo arobiodu street, ikoyi',
    venue: 'Blue Note Jazz Club',
    location: 'Ikoyi',
    state: 'lagos',
    startTime: '20:00',
    endTime: '23:30',
    event_date: new Date('2026-06-20'),
    ticket_end: new Date('2026-06-17'),
    status: 'published',
    ticketType: [
      { name: 'General', price: 2500, capacity: 200, sold: 140 },
      { name: 'Premium', price: 7500, capacity: 50, sold: 42 },
    ],
    gateRules: ['Semi-formal attire', 'Drinks available at bar', 'Quiet please during performances'],
    images: [
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
      'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=800',
    ],
  },
  {
    organizerIndex: 0,
    name: 'Freestyle Fridays Open Mic',
    category: 'Music',
    description:
      'Every Friday, emerging artists showcase their talent. Open to musicians, poets, and spoken word performers.',
    address: '45 awolowo road, ikoyi',
    venue: 'The Creative Space',
    location: 'Ikoyi',
    state: 'lagos',
    startTime: '19:00',
    endTime: '22:00',
    event_date: new Date('2026-06-06'),
    ticket_end: new Date('2026-06-05'),
    status: 'draft',
    ticketType: [{ name: 'Free Entry', price: 0, capacity: 150, sold: 0 }],
    gateRules: ['Registration for performers recommended', 'No explicit content', 'Support local talent'],
    images: [
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
    ],
  },

  // Organizer 1: techhubnig - Tech & Business, Abuja
  {
    organizerIndex: 1,
    name: 'Build Nigeria Summit 2026',
    category: 'Tech',
    description:
      'Annual gathering of tech entrepreneurs, investors, and developers in Nigeria. Network with leading innovators and pitch your startup.',
    address: '123 mohammed maitama sule, central business district',
    venue: 'Nicon Hilton Abuja',
    location: 'CBD',
    state: 'abuja',
    startTime: '08:00',
    endTime: '18:00',
    event_date: new Date('2026-07-25'),
    ticket_end: new Date('2026-07-20'),
    status: 'published',
    featured: true,
    ticketType: [
      { name: 'General', price: 10000, capacity: 500, sold: 380 },
      { name: 'Startup Pass', price: 25000, capacity: 100, sold: 78 },
      { name: 'Sponsor', price: 100000, capacity: 10, sold: 8 },
    ],
    gateRules: ['Professional attire', 'ID check required', 'Networking dinner included for sponsors'],
    images: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      'https://images.unsplash.com/photo-1460925895917-aeb19be489c7?w=800',
    ],
  },
  {
    organizerIndex: 1,
    name: 'Women in Tech Abuja',
    category: 'Tech',
    description:
      'Celebrating female engineers, designers, and tech leaders. Workshops, mentorship sessions, and career advancement talks.',
    address: '456 kumasi crescent, maitama',
    venue: 'Innovation Hub Africa',
    location: 'Maitama',
    state: 'abuja',
    startTime: '09:00',
    endTime: '16:00',
    event_date: new Date('2026-06-14'),
    ticket_end: new Date('2026-06-10'),
    status: 'published',
    ticketType: [
      { name: 'Free', price: 0, capacity: 300, sold: 0 },
      { name: 'VIP Workshop', price: 5000, capacity: 50, sold: 38 },
    ],
    gateRules: ['Gender-inclusive event', 'Networking lunch provided', 'Register to attend'],
    images: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    ],
  },
  {
    organizerIndex: 1,
    name: 'Fintech Nigeria Conference',
    category: 'Business',
    description:
      'Deep dive into financial technology innovation in Nigeria. Featured speakers from leading fintech startups, banks, and regulators.',
    address: '789 eko boulevard, victoria island',
    venue: 'Transcorp Hilton Abuja',
    location: 'CBD',
    state: 'abuja',
    startTime: '08:30',
    endTime: '17:00',
    event_date: new Date('2026-09-18'),
    ticket_end: new Date('2026-09-13'),
    status: 'published',
    ticketType: [
      { name: 'Standard', price: 15000, capacity: 400, sold: 320 },
      { name: 'Premium', price: 40000, capacity: 80, sold: 62 },
      { name: 'Enterprise Table', price: 200000, capacity: 5, sold: 4 },
    ],
    gateRules: ['Business formal attire', 'Two-day access', 'Networking cocktails evening'],
    images: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    ],
  },
  {
    organizerIndex: 1,
    name: 'AI & Future of Work Workshop',
    category: 'Tech',
    description:
      'Interactive workshop on how artificial intelligence is reshaping the workplace. Hands-on demos and expert insights.',
    address: '321 diplomatic drive, maitama',
    venue: 'Tech Learning Center Abuja',
    location: 'Maitama',
    state: 'abuja',
    startTime: '10:00',
    endTime: '16:00',
    event_date: new Date('2026-06-28'),
    ticket_end: new Date('2026-06-24'),
    status: 'published',
    ticketType: [
      { name: 'Early Bird', price: 4000, capacity: 100, sold: 85 },
      { name: 'Regular', price: 7500, capacity: 100, sold: 72 },
    ],
    gateRules: ['Laptop recommended', 'Lunch provided', 'Certificate of attendance'],
    images: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    ],
  },
  {
    organizerIndex: 1,
    name: 'DevFest Abuja 2026',
    category: 'Tech',
    description:
      'The biggest developer festival in Abuja. Code labs, lightning talks, and community celebrations. This year was amazing!',
    address: '555 aminu kano crescent, wuse',
    venue: 'Federal Palace Hotel Abuja',
    location: 'Wuse',
    state: 'abuja',
    startTime: '08:00',
    endTime: '18:00',
    event_date: new Date('2026-04-05'),
    ticket_end: new Date('2026-04-01'),
    status: 'ended',
    ticketType: [
      { name: 'General Free', price: 0, capacity: 600, sold: 0 },
      { name: 'Workshop', price: 2000, capacity: 100, sold: 85 },
    ],
    gateRules: ['Open to all developers', 'Free T-shirt for attendees', 'Food and beverages included'],
    images: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    ],
  },

  // Organizer 2: naijavibes - Arts & Culture, Port Harcourt
  {
    organizerIndex: 2,
    name: 'Rivers Food & Culture Festival',
    category: 'Food & Drinks',
    description:
      'Celebrate Nigerian food culture with tastings from top chefs. Live cooking demos, cultural performances, and artisan stalls.',
    address: '100 trans-amadi industrial layout, port harcourt',
    venue: 'Culture Park Port Harcourt',
    location: 'Port Harcourt',
    state: 'rivers',
    startTime: '11:00',
    endTime: '21:00',
    event_date: new Date('2026-07-19'),
    ticket_end: new Date('2026-07-16'),
    status: 'published',
    featured: true,
    ticketType: [
      { name: 'Day Pass', price: 3000, capacity: 800, sold: 650 },
      { name: 'Weekend Pass', price: 5000, capacity: 500, sold: 420 },
      { name: 'VIP', price: 12000, capacity: 100, sold: 89 },
    ],
    gateRules: ['Family friendly', 'Parking available', 'Bring appetite and friends'],
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561084?w=800',
      'https://images.unsplash.com/photo-1504674900897-38e91ee62b65?w=800',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
    ],
  },
  {
    organizerIndex: 2,
    name: 'PH Art Week 2026',
    category: 'Arts & Culture',
    description:
      'Week-long celebration of visual arts in Port Harcourt. Gallery openings, artist talks, and live art demonstrations.',
    address: '200 ikwerre road, port harcourt',
    venue: 'Arts & Culture Centre PH',
    location: 'Port Harcourt',
    state: 'rivers',
    startTime: '10:00',
    endTime: '19:00',
    event_date: new Date('2026-08-22'),
    ticket_end: new Date('2026-08-19'),
    status: 'published',
    ticketType: [
      { name: 'General', price: 1500, capacity: 300, sold: 220 },
      { name: 'Artist Collector Pass', price: 8000, capacity: 50, sold: 42 },
    ],
    gateRules: ['Support local art', 'Photography allowed', 'Art for sale at venues'],
    images: [
      'https://images.unsplash.com/photo-1560807707-38cc396b72e9?w=800',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
    ],
  },
  {
    organizerIndex: 2,
    name: 'Afrobeats Dance Battle Championship',
    category: 'Music',
    description:
      'Premier dance competition featuring best dance crews in Nigeria. Categories: freestyle, choreography, and crew battles.',
    address: '50 legislative avenue, port harcourt',
    venue: 'Rivers State Sports Complex',
    location: 'Port Harcourt',
    state: 'rivers',
    startTime: '15:00',
    endTime: '22:00',
    event_date: new Date('2026-07-05'),
    ticket_end: new Date('2026-07-02'),
    status: 'published',
    pick: true,
    ticketType: [
      { name: 'Spectator', price: 2000, capacity: 500, sold: 420 },
      { name: 'Competitor', price: 3500, capacity: 100, sold: 78 },
    ],
    gateRules: ['Valid ID for competitors', 'Early registration closes day before', 'Live judging, live winners'],
    images: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    ],
  },
  {
    organizerIndex: 2,
    name: 'Nigerian Film Premiere: "Lagos Nights"',
    category: 'Film & Media',
    description:
      'World premiere of the highly anticipated Nigerian drama. Red carpet event with cast and filmmakers. Q&A session after screening.',
    address: '75 creek road, port harcourt',
    venue: 'Silverbird Cinema PH',
    location: 'Port Harcourt',
    state: 'rivers',
    startTime: '18:00',
    endTime: '21:30',
    event_date: new Date('2026-06-30'),
    ticket_end: new Date('2026-06-27'),
    status: 'published',
    ticketType: [
      { name: 'Standard', price: 4500, capacity: 200, sold: 165 },
      { name: 'Premium', price: 10000, capacity: 50, sold: 42 },
    ],
    gateRules: ['Smart casual attire', 'Red carpet entry at 5pm', 'No late entry after film starts'],
    images: [
      'https://images.unsplash.com/photo-1594909122845-11beda881d8b?w=800',
      'https://images.unsplash.com/photo-1485095329183-d0797cdc5676?w=800',
    ],
  },
  {
    organizerIndex: 2,
    name: 'Heritage & Fashion Night',
    category: 'Fashion',
    description:
      'Fashion show blending traditional Nigerian heritage with contemporary styles. Runway by emerging and established designers.',
    address: '150 jean paul avenue, port harcourt',
    venue: 'Grand Tropicana Events Centre',
    location: 'Port Harcourt',
    state: 'rivers',
    startTime: '19:00',
    endTime: '22:00',
    event_date: new Date('2026-09-12'),
    ticket_end: new Date('2026-09-09'),
    status: 'draft',
    ticketType: [
      { name: 'General', price: 6000, capacity: 200, sold: 0 },
      { name: 'Backstage VIP', price: 20000, capacity: 30, sold: 0 },
    ],
    gateRules: ['Elegant attire recommended', 'Photography permitted', 'Cocktail reception'],
    images: [
      'https://images.unsplash.com/photo-1509225287000-af196143797c?w=800',
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800',
    ],
  },

  // Organizer 3: activelagos - Sports & Comedy, Lagos
  {
    organizerIndex: 3,
    name: 'Lagos Marathon After-Party',
    category: 'Sports & Fitness',
    description:
      'Celebrate finishing the marathon with refreshments, entertainment, and recovery sessions. Runners and spectators welcome.',
    address: '10 lekki-epe expressway, lekki',
    venue: 'Lekki Sports Pavilion',
    location: 'Lekki',
    state: 'lagos',
    startTime: '15:00',
    endTime: '22:00',
    event_date: new Date('2026-06-21'),
    ticket_end: new Date('2026-06-19'),
    status: 'published',
    ticketType: [
      { name: 'General', price: 2000, capacity: 500, sold: 380 },
      { name: 'VIP Lounge', price: 8000, capacity: 100, sold: 78 },
    ],
    gateRules: ['Marathon bib required for discounts', 'Bring finisher medal', 'Cool zone available'],
    images: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
      'https://images.unsplash.com/photo-1552674605-5defe6aa44bb?w=800',
    ],
  },
  {
    organizerIndex: 3,
    name: 'Naija Comedy Nite Vol. 12',
    category: 'Comedy',
    description:
      'Biggest comedy night in Lagos featuring top Nigerian comedians. Non-stop laughter and entertainment from start to finish.',
    address: '20 admiralty road, lekki',
    venue: 'The Palms Shopping Mall Events',
    location: 'Lekki',
    state: 'lagos',
    startTime: '19:00',
    endTime: '23:00',
    event_date: new Date('2026-07-18'),
    ticket_end: new Date('2026-07-15'),
    status: 'published',
    ticketType: [
      { name: 'Regular', price: 5000, capacity: 600, sold: 480 },
      { name: 'Front Row', price: 12000, capacity: 80, sold: 68 },
      { name: 'Backstage Meet', price: 25000, capacity: 20, sold: 16 },
    ],
    gateRules: ['Audience participation encouraged', 'Recording artists permitted', 'Age 18+ recommended'],
    images: [
      'https://images.unsplash.com/photo-1514995428259-eea3a00b4797?w=800',
      'https://images.unsplash.com/photo-1501196354995-b8900edc628f?w=800',
    ],
  },
  {
    organizerIndex: 3,
    name: 'CrossFit Lagos Open',
    category: 'Sports & Fitness',
    description:
      'CrossFit competition with scaling divisions for all levels. Watch elite athletes compete or participate in scaled categories.',
    address: '30 ikoyi crescent, ikoyi',
    venue: 'CrossFit Hub Lagos',
    location: 'Ikoyi',
    state: 'lagos',
    startTime: '08:00',
    endTime: '17:00',
    event_date: new Date('2026-06-07'),
    ticket_end: new Date('2026-06-04'),
    status: 'published',
    ticketType: [
      { name: 'Competitor', price: 3000, capacity: 200, sold: 145 },
      { name: 'Spectator Free', price: 0, capacity: 300, sold: 0 },
    ],
    gateRules: ['Medical clearance for competitors', 'Parking available', 'Vendors on site'],
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      'https://images.unsplash.com/photo-1517836357463-d25ddfcb3ef1?w=800',
    ],
  },
  {
    organizerIndex: 3,
    name: 'Stand-Up Sunday Ibadan',
    category: 'Comedy',
    description:
      'Weekly stand-up comedy show featuring new and established comedians. Intimate venue with great sound and sightlines.',
    address: '100 agbowo avenue, ibadan',
    venue: 'Comedy Loft Ibadan',
    location: 'Ibadan',
    state: 'oyo',
    startTime: '18:00',
    endTime: '21:00',
    event_date: new Date('2026-07-26'),
    ticket_end: new Date('2026-07-24'),
    status: 'published',
    ticketType: [
      { name: 'Standard', price: 3000, capacity: 250, sold: 195 },
      { name: 'Premium', price: 7000, capacity: 50, sold: 38 },
    ],
    gateRules: ['Hecklers will be removed', 'Drink minimum not enforced', 'Table reservations available'],
    images: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    ],
  },
  {
    organizerIndex: 3,
    name: 'Lagos Fitness Expo 2026',
    category: 'Health & Wellness',
    description:
      'Two-day expo showcasing fitness brands, wellness products, and health services. Workshops and product demos throughout.',
    address: '15 victoria island, lagos',
    venue: 'Convention Centre Lagos',
    location: 'Victoria Island',
    state: 'lagos',
    startTime: '09:00',
    endTime: '18:00',
    event_date: new Date('2026-03-15'),
    ticket_end: new Date('2026-03-12'),
    status: 'ended',
    ticketType: [
      { name: 'Day Pass', price: 1500, capacity: 400, sold: 0 },
      { name: 'Premium', price: 5000, capacity: 100, sold: 0 },
    ],
    gateRules: ['Health insurance info required', 'Free health screening stations', 'Expo bag included'],
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      'https://images.unsplash.com/photo-1431324155629-1e7edf8356f7?w=800',
    ],
  },
];

// Connect to DB
await mongoose.connect(process.env.MONGO);
console.log('✓ Connected to MongoDB');

try {
  // Step 1: Upsert all organizers
  console.log('\n📝 Upserting 4 organizers...');
  const savedOrganizers = [];

  for (const orgData of organizers) {
    const hashedPassword = await bcrypt.hash(orgData.password, 10);
    const saved = await User.findOneAndUpdate(
      { email: orgData.email },
      {
        ...orgData,
        password: hashedPassword,
        address: 'Lagos, Nigeria',
        image: 'https://i.pravatar.cc/150?u=' + orgData.email,
        bgImg: 'https://images.unsplash.com/photo-1517836357463-d25ddfcb3ef1?w=800',
      },
      { upsert: true, new: true }
    );
    savedOrganizers.push(saved);
    console.log(`  ✓ ${orgData.username} (${orgData.email})`);
  }

  // Step 2: Upsert 20 events
  console.log('\n🎟️  Upserting 20 events...');
  let eventCount = 0;

  for (const eventTemplate of eventTemplates) {
    const organizer = savedOrganizers[eventTemplate.organizerIndex];

    const eventData = {
      name: eventTemplate.name.toLowerCase(),
      planner_id: organizer._id.toString(),
      planner: organizer.username,
      category: eventTemplate.category,
      description: eventTemplate.description,
      address: eventTemplate.address.toLowerCase(),
      venue: eventTemplate.venue.toLowerCase(),
      location: eventTemplate.location.toLowerCase(),
      state: eventTemplate.state.toLowerCase(),
      startTime: eventTemplate.startTime,
      endTime: eventTemplate.endTime,
      event_date: eventTemplate.event_date,
      ticket_end: eventTemplate.ticket_end,
      status: eventTemplate.status,
      featured: eventTemplate.featured || false,
      pick: eventTemplate.pick || false,
      ticketType: eventTemplate.ticketType,
      gateRules: eventTemplate.gateRules,
      images: eventTemplate.images,
      sold: eventTemplate.ticketType.reduce((sum, tt) => sum + (tt.sold || 0), 0),
      slug: generateSlug(eventTemplate.name),
    };

    const saved = await Event.findOneAndUpdate(
      { slug: eventData.slug },
      eventData,
      { upsert: true, new: true }
    );

    eventCount++;
    console.log(`  ✓ ${eventTemplate.name}`);
  }

  console.log(`\n✅ Seed completed successfully!`);
  console.log(`\n📊 Summary:`);
  console.log(`  • 4 organizers (partners) upserted`);
  console.log(`  • 20 events created`);
  console.log(`  • 5 events per organizer`);
  console.log(`  • 17 published, 2 draft, 1 ended`);
  console.log(`  • 7 Nigerian states represented`);
  console.log(`  • 10 different categories`);
  console.log(`\n🔐 Test Credentials:`);
  console.log(`  Partner       | partner@comfytag.dev     | TestPass123!`);
  console.log(`  Tech Hub      | tech@comfytag.dev        | TechPass123!`);
  console.log(`  Naija Vibes   | vibes@comfytag.dev       | VibesPass123!`);
  console.log(`  Active Lagos  | active@comfytag.dev      | ActivePass123!\n`);
} catch (error) {
  console.error('❌ Seed failed:', error.message);
  process.exit(1);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB\n');
}
