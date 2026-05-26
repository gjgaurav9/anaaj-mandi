import type { Types } from 'mongoose';
import { connectDb, disconnectDb } from './connection.js';
import { UserModel } from './models/User.js';
import { LotModel } from './models/Lot.js';
import { PriceTickModel } from './models/PriceTick.js';
import { InquiryModel } from './models/Inquiry.js';
import { TransactionModel } from './models/Transaction.js';

/**
 * Seed Anaaj Mandi v1 (broker-pivot edition).
 *
 *   1 admin · 3 brokers · 5 buyers · 10 wheat lots · today's price ticks.
 *
 * Farmers (sellers) are NOT users — their contact info lives embedded on
 * each lot, captured by the broker offline.
 *
 * Refuses to run in production by default. Override with FORCE_SEED=true.
 */

const MP_STATE = 'Madhya Pradesh';
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

// ---- demo geo points (lng, lat) ----
const GEO = {
  indoreCity: [75.8577, 22.7196] as [number, number],
  indoreChhawni: [75.8722, 22.7019] as [number, number],
  indoreLaxmibai: [75.881, 22.733] as [number, number],
  mhow: [75.7626, 22.551] as [number, number],
  dewas: [76.0533, 22.9676] as [number, number],
  dhar: [75.303, 22.6019] as [number, number],
  ujjain: [75.7885, 23.1765] as [number, number],
  sehore: [77.0856, 23.2024] as [number, number],
  betma: [75.6275, 22.6864] as [number, number],
  depalpur: [75.5436, 22.847] as [number, number],
};

const USERS = {
  admin: {
    phone: '+919800000099',
    name: 'Anaaj Admin',
    role: 'admin' as const,
  },
  brokers: [
    {
      phone: '+919800000011',
      name: 'Lalit Agarwal',
      city: 'Indore',
      geo: GEO.indoreChhawni,
      mandi: 'Indore Chhawni',
      years: 18,
    },
    {
      phone: '+919800000012',
      name: 'Vinod Jain',
      city: 'Indore',
      geo: GEO.indoreLaxmibai,
      mandi: 'Laxmibai Nagar',
      years: 11,
    },
    {
      phone: '+919800000013',
      name: 'Mukesh Soni',
      city: 'Dewas',
      geo: GEO.dewas,
      mandi: 'Dewas',
      years: 7,
    },
  ],
  buyers: [
    {
      phone: '+919800000021',
      name: 'Anita Mehta',
      city: 'Indore',
      geo: GEO.indoreCity,
      company: 'Mehta Flour Mills',
    },
    {
      phone: '+919800000022',
      name: 'Rajesh Garg',
      city: 'Indore',
      geo: GEO.indoreCity,
      company: 'Garg Aata Industries',
    },
    {
      phone: '+919800000023',
      name: 'Priya Kothari',
      city: 'Ujjain',
      geo: GEO.ujjain,
      company: 'Kothari Exports Pvt Ltd',
    },
    {
      phone: '+919800000024',
      name: 'Vikram Singh',
      city: 'Dewas',
      geo: GEO.dewas,
      company: 'Singh Roller Mills',
    },
    {
      phone: '+919800000025',
      name: 'Sneha Bansal',
      city: 'Bhopal',
      geo: GEO.sehore,
      company: 'Bansal Grains LLP',
    },
  ],
};

// placehold.co generates colored SVGs on demand — reliable, no external account
// needed, palette tuned to match the wheat theme.
const VARIETY_PHOTO_BG: Record<string, { bg: string; fg: string }> = {
  lokwan: { bg: 'd4a017', fg: 'ffffff' },
  sharbati: { bg: 'a87a0c', fg: 'ffffff' },
  sehore: { bg: 'e6b85b', fg: '4b3a0d' },
  mp_sihore: { bg: 'fff8c4', fg: '4b3a0d' },
};

function photosForVariety(variety: keyof typeof VARIETY_PHOTO_BG): string[] {
  const palette = VARIETY_PHOTO_BG[variety] ?? VARIETY_PHOTO_BG.lokwan!;
  const label = variety.replace('_', '+');
  return [
    `https://placehold.co/800x600/${palette.bg}/${palette.fg}?text=${label}+wheat`,
    `https://placehold.co/800x600/${palette.bg}/${palette.fg}?text=lot+photo+2`,
  ];
}

function buildLot(args: {
  brokerId: Types.ObjectId;
  seller: { name: string; phone: string; village?: string };
  variety: 'lokwan' | 'sharbati' | 'sehore' | 'mp_sihore';
  qty: number;
  pricePaise: number;
  moisture: number;
  fm: number;
  broken: number;
  protein?: number;
  city: string;
  district: string;
  pincode: string;
  geo: [number, number];
  daysFromNow: number;
  status?: 'draft' | 'active' | 'reserved' | 'sold';
}) {
  const available = new Date(today);
  available.setDate(available.getDate() + args.daysFromNow);
  return {
    broker_id: args.brokerId,
    seller: args.seller,
    grain: 'wheat' as const,
    variety: args.variety,
    quantity_quintals: args.qty,
    price_per_quintal: args.pricePaise,
    quality: {
      moisture_pct: args.moisture,
      foreign_matter_pct: args.fm,
      broken_pct: args.broken,
      protein_pct: args.protein,
    },
    photos: photosForVariety(args.variety),
    pickup_location: {
      city: args.city,
      district: args.district,
      pincode: args.pincode,
      geo: { type: 'Point' as const, coordinates: args.geo },
    },
    available_from: available,
    status: args.status ?? 'active',
  };
}

// ---- demo farmers (sourced offline; live embedded on lots) ----
const FARMERS = {
  ramesh: { name: 'Ramesh Patidar', phone: '+919812345001', village: 'Indore' },
  suresh: { name: 'Suresh Yadav', phone: '+919812345002', village: 'Depalpur' },
  manoj: { name: 'Manoj Verma', phone: '+919812345003', village: 'Mhow' },
  kailash: { name: 'Kailash Sharma', phone: '+919812345004', village: 'Sanwer' },
  pankaj: { name: 'Pankaj Chouhan', phone: '+919812345005', village: 'Betma' },
  dineshDhar: { name: 'Dinesh Solanki', phone: '+919812345006', village: 'Dhar' },
  ravi: { name: 'Ravi Gurjar', phone: '+919812345007', village: 'Sehore' },
};

async function run() {
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
    throw new Error('Refusing to seed in production. Set FORCE_SEED=true to override.');
  }
  await connectDb();
  console.log('→ connected');

  console.log('→ clearing collections');
  await Promise.all([
    UserModel.deleteMany({}),
    LotModel.deleteMany({}),
    InquiryModel.deleteMany({}),
    PriceTickModel.deleteMany({}),
    TransactionModel.deleteMany({}),
  ]);

  console.log('→ inserting users');
  const admin = await UserModel.create({
    phone: USERS.admin.phone,
    name: USERS.admin.name,
    role: USERS.admin.role,
    kyc: { status: 'verified', verified_at: today },
  });

  const brokers = await UserModel.insertMany(
    USERS.brokers.map((b) => ({
      phone: b.phone,
      name: b.name,
      role: 'broker' as const,
      kyc: { status: 'verified', verified_at: today, pan_last4: '5678' },
      business_name: `${b.name.split(' ')[0]} Trading`,
      broker_mandi: b.mandi,
      broker_years: b.years,
      location: {
        city: b.city,
        district: b.city === 'Dewas' ? 'Dewas' : 'Indore',
        state: MP_STATE,
        pincode: b.city === 'Dewas' ? '455001' : '452001',
        geo: { type: 'Point', coordinates: b.geo },
      },
    })),
  );

  const buyers = await UserModel.insertMany(
    USERS.buyers.map((b) => ({
      phone: b.phone,
      name: b.name,
      role: 'buyer' as const,
      kyc: { status: 'verified', verified_at: today, pan_last4: '9012' },
      buyer_company: b.company,
      buyer_gst: '23ABCDE1234F1Z5',
      location: {
        city: b.city,
        district: b.city,
        state: MP_STATE,
        pincode: '452010',
        geo: { type: 'Point', coordinates: b.geo },
      },
    })),
  );

  console.log(`  admin=${admin._id.toString()} brokers=${brokers.length} buyers=${buyers.length}`);

  const b0 = brokers[0]!._id as unknown as Types.ObjectId; // Lalit (Indore Chhawni)
  const b1 = brokers[1]!._id as unknown as Types.ObjectId; // Vinod (Laxmibai Nagar)
  const b2 = brokers[2]!._id as unknown as Types.ObjectId; // Mukesh (Dewas)

  console.log('→ inserting lots');
  const lots = [
    buildLot({
      brokerId: b0,
      seller: FARMERS.ramesh,
      variety: 'lokwan',
      qty: 120,
      pricePaise: 252000,
      moisture: 11.2,
      fm: 0.8,
      broken: 1.5,
      protein: 11.8,
      city: 'Indore',
      district: 'Indore',
      pincode: '452001',
      geo: GEO.indoreCity,
      daysFromNow: 2,
    }),
    buildLot({
      brokerId: b1,
      seller: FARMERS.suresh,
      variety: 'sharbati',
      qty: 60,
      pricePaise: 318500,
      moisture: 10.4,
      fm: 0.5,
      broken: 1.1,
      protein: 12.5,
      city: 'Depalpur',
      district: 'Indore',
      pincode: '453115',
      geo: GEO.depalpur,
      daysFromNow: 4,
    }),
    buildLot({
      brokerId: b0,
      seller: FARMERS.manoj,
      variety: 'mp_sihore',
      qty: 200,
      pricePaise: 268000,
      moisture: 11.8,
      fm: 1.1,
      broken: 1.8,
      city: 'Mhow',
      district: 'Indore',
      pincode: '453441',
      geo: GEO.mhow,
      daysFromNow: 1,
    }),
    buildLot({
      brokerId: b1,
      seller: FARMERS.kailash,
      variety: 'sehore',
      qty: 85,
      pricePaise: 261500,
      moisture: 11.5,
      fm: 0.9,
      broken: 1.6,
      protein: 11.2,
      city: 'Sanwer',
      district: 'Indore',
      pincode: '453551',
      geo: GEO.depalpur,
      daysFromNow: 3,
    }),
    buildLot({
      brokerId: b1,
      seller: FARMERS.pankaj,
      variety: 'lokwan',
      qty: 150,
      pricePaise: 249000,
      moisture: 11.6,
      fm: 1.0,
      broken: 1.4,
      city: 'Betma',
      district: 'Indore',
      pincode: '453331',
      geo: GEO.betma,
      daysFromNow: 5,
    }),
    buildLot({
      brokerId: b0,
      seller: FARMERS.ramesh,
      variety: 'sharbati',
      qty: 45,
      pricePaise: 325000,
      moisture: 10.2,
      fm: 0.4,
      broken: 0.9,
      protein: 12.9,
      city: 'Indore',
      district: 'Indore',
      pincode: '452002',
      geo: GEO.indoreCity,
      daysFromNow: 7,
      status: 'draft',
    }),
    buildLot({
      brokerId: b2,
      seller: FARMERS.suresh,
      variety: 'lokwan',
      qty: 300,
      pricePaise: 254500,
      moisture: 11.0,
      fm: 0.7,
      broken: 1.3,
      protein: 11.6,
      city: 'Dewas',
      district: 'Dewas',
      pincode: '455001',
      geo: GEO.dewas,
      daysFromNow: 6,
    }),
    buildLot({
      brokerId: b2,
      seller: FARMERS.manoj,
      variety: 'mp_sihore',
      qty: 90,
      pricePaise: 270000,
      moisture: 11.4,
      fm: 1.2,
      broken: 1.7,
      city: 'Mhow',
      district: 'Indore',
      pincode: '453441',
      geo: GEO.mhow,
      daysFromNow: 2,
    }),
    buildLot({
      brokerId: b0,
      seller: FARMERS.ravi,
      variety: 'sehore',
      qty: 110,
      pricePaise: 263000,
      moisture: 11.7,
      fm: 1.0,
      broken: 1.5,
      city: 'Sehore',
      district: 'Sehore',
      pincode: '466001',
      geo: GEO.sehore,
      daysFromNow: 4,
    }),
    buildLot({
      brokerId: b2,
      seller: FARMERS.dineshDhar,
      variety: 'sharbati',
      qty: 70,
      pricePaise: 322000,
      moisture: 10.5,
      fm: 0.5,
      broken: 1.0,
      protein: 12.6,
      city: 'Dhar',
      district: 'Dhar',
      pincode: '454001',
      geo: GEO.dhar,
      daysFromNow: 3,
      status: 'reserved',
    }),
  ];
  const inserted = await LotModel.insertMany(lots);
  console.log(`  lots=${inserted.length}`);

  console.log('→ inserting price ticks for today');
  const ticks: Array<{
    mandi:
      | 'indore_chhawni'
      | 'indore_laxmibai_nagar'
      | 'mhow'
      | 'dewas'
      | 'dhar'
      | 'ujjain'
      | 'sehore';
    variety: 'lokwan' | 'sharbati' | 'sehore' | 'mp_sihore';
    min: number;
    modal: number;
    max: number;
  }> = [
    { mandi: 'indore_chhawni', variety: 'lokwan', min: 248000, modal: 252000, max: 258000 },
    { mandi: 'indore_chhawni', variety: 'sharbati', min: 312000, modal: 320000, max: 332000 },
    { mandi: 'indore_chhawni', variety: 'mp_sihore', min: 261000, modal: 268000, max: 275000 },
    {
      mandi: 'indore_laxmibai_nagar',
      variety: 'lokwan',
      min: 249000,
      modal: 253000,
      max: 259000,
    },
    {
      mandi: 'indore_laxmibai_nagar',
      variety: 'sehore',
      min: 258000,
      modal: 264000,
      max: 271000,
    },
    { mandi: 'mhow', variety: 'lokwan', min: 246000, modal: 251000, max: 256000 },
    { mandi: 'dewas', variety: 'lokwan', min: 250000, modal: 255000, max: 262000 },
    { mandi: 'dewas', variety: 'sharbati', min: 308000, modal: 318000, max: 328000 },
    { mandi: 'ujjain', variety: 'lokwan', min: 247000, modal: 251000, max: 257000 },
    { mandi: 'sehore', variety: 'sehore', min: 260000, modal: 266000, max: 273000 },
  ];

  await PriceTickModel.insertMany(
    ticks.map((t) => ({
      grain: 'wheat',
      mandi: t.mandi,
      variety: t.variety,
      price_min: t.min,
      price_modal: t.modal,
      price_max: t.max,
      source: 'manual',
      date: today,
    })),
  );
  console.log(`  price_ticks=${ticks.length}`);

  console.log('\n✓ seed complete. Demo accounts (OTP: 123456):');
  console.log(`  admin   : ${USERS.admin.phone}  (${USERS.admin.name})`);
  console.log(`  broker  : ${USERS.brokers[0]!.phone}  (${USERS.brokers[0]!.name})`);
  console.log(`  buyer   : ${USERS.buyers[0]!.phone}  (${USERS.buyers[0]!.name})`);
  console.log(`\nFarmers (offline contacts, not users):`);
  for (const f of Object.values(FARMERS)) {
    console.log(`  ${f.name.padEnd(22)} ${f.phone}  (${f.village})`);
  }

  await disconnectDb();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
