import type { Types } from 'mongoose';
import { connectDb, disconnectDb } from './connection.js';
import { UserModel } from './models/User.js';
import { LotModel, type Grain } from './models/Lot.js';
import { PriceTickModel } from './models/PriceTick.js';
import { InquiryModel } from './models/Inquiry.js';
import { TransactionModel } from './models/Transaction.js';

/**
 * Seed Anaaj Mandi v1 (multi-grain edition).
 *
 *   1 admin · 3 brokers · 5 buyers
 *   ~20 lots spread across 8 grains (wheat, soybean, chana, maize, mustard,
 *   jowar, bajra, rice) · today's price ticks for each grain × mandi pair
 *
 * Farmers (sellers) are NOT users — their contact info lives embedded on
 * each lot, captured by the broker offline.
 *
 * Refuses to run in production by default. Override with FORCE_SEED=true.
 */

const MP_STATE = 'Madhya Pradesh';
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

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
  admin: { phone: '+919800000099', name: 'Anaaj Admin', role: 'admin' as const },
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

const FARMERS = {
  ramesh: { name: 'Ramesh Patidar', phone: '+919812345001', village: 'Indore' },
  suresh: { name: 'Suresh Yadav', phone: '+919812345002', village: 'Depalpur' },
  manoj: { name: 'Manoj Verma', phone: '+919812345003', village: 'Mhow' },
  kailash: { name: 'Kailash Sharma', phone: '+919812345004', village: 'Sanwer' },
  pankaj: { name: 'Pankaj Chouhan', phone: '+919812345005', village: 'Betma' },
  dinesh: { name: 'Dinesh Solanki', phone: '+919812345006', village: 'Dhar' },
  ravi: { name: 'Ravi Gurjar', phone: '+919812345007', village: 'Sehore' },
  sushil: { name: 'Sushil Kumawat', phone: '+919812345008', village: 'Dewas' },
  prakash: { name: 'Prakash Maliviya', phone: '+919812345009', village: 'Ujjain' },
  hari: { name: 'Hari Kushwah', phone: '+919812345010', village: 'Mhow' },
};

// Per-grain palette for placehold.co photos.
const GRAIN_PALETTE: Record<Grain, { bg: string; fg: string }> = {
  wheat: { bg: 'd4a017', fg: 'ffffff' },
  soybean: { bg: '6b8e23', fg: 'ffffff' },
  chana: { bg: '8b6f47', fg: 'ffffff' },
  maize: { bg: 'daa520', fg: 'ffffff' },
  mustard: { bg: 'f4c430', fg: '4b3a0d' },
  jowar: { bg: 'b8a361', fg: 'ffffff' },
  bajra: { bg: '8b7355', fg: 'ffffff' },
  rice: { bg: 'e8d7b3', fg: '4b3a0d' },
  other: { bg: '6b7280', fg: 'ffffff' },
};

function photosForLot(grain: Grain, variety: string): string[] {
  const palette = GRAIN_PALETTE[grain];
  const slug = encodeURIComponent(variety.replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, '+'));
  return [
    `https://placehold.co/800x600/${palette.bg}/${palette.fg}/png?text=${slug}`,
    `https://placehold.co/800x600/${palette.bg}/${palette.fg}/png?text=lot+photo+2`,
  ];
}

interface BuildLotArgs {
  brokerId: Types.ObjectId;
  seller: { name: string; phone: string; village?: string };
  grain: Grain;
  variety: string;
  qty: number;
  pricePaise: number;
  quality: { moisture: number; fm: number; broken: number; protein?: number };
  pickup: { city: string; district: string; pincode: string; geo: [number, number] };
  daysFromNow: number;
  status?: 'draft' | 'active' | 'reserved' | 'sold';
}

function buildLot(a: BuildLotArgs) {
  const available = new Date(today);
  available.setDate(available.getDate() + a.daysFromNow);
  return {
    broker_id: a.brokerId,
    seller: a.seller,
    grain: a.grain,
    variety: a.variety,
    quantity_quintals: a.qty,
    price_per_quintal: a.pricePaise,
    quality: {
      moisture_pct: a.quality.moisture,
      foreign_matter_pct: a.quality.fm,
      broken_pct: a.quality.broken,
      protein_pct: a.quality.protein,
    },
    photos: photosForLot(a.grain, a.variety),
    pickup_location: {
      city: a.pickup.city,
      district: a.pickup.district,
      pincode: a.pickup.pincode,
      geo: { type: 'Point' as const, coordinates: a.pickup.geo },
    },
    available_from: available,
    status: a.status ?? 'active',
  };
}

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
  // Drop legacy indexes so the new compound (grain, mandi, variety, date) one
  // applies cleanly on re-create.
  try {
    await PriceTickModel.collection.dropIndexes();
  } catch {
    // collection might not exist yet on a fresh DB
  }
  try {
    await LotModel.collection.dropIndexes();
  } catch {
    // same
  }

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
  console.log(`  admin=${admin._id} brokers=${brokers.length} buyers=${buyers.length}`);

  const b0 = brokers[0]!._id as unknown as Types.ObjectId; // Lalit, Indore Chhawni
  const b1 = brokers[1]!._id as unknown as Types.ObjectId; // Vinod, Laxmibai Nagar
  const b2 = brokers[2]!._id as unknown as Types.ObjectId; // Mukesh, Dewas

  // Pickup helpers
  const indore = { city: 'Indore', district: 'Indore', pincode: '452001', geo: GEO.indoreCity };
  const mhow = { city: 'Mhow', district: 'Indore', pincode: '453441', geo: GEO.mhow };
  const dewas = { city: 'Dewas', district: 'Dewas', pincode: '455001', geo: GEO.dewas };
  const ujjain = { city: 'Ujjain', district: 'Ujjain', pincode: '456001', geo: GEO.ujjain };
  const sehore = { city: 'Sehore', district: 'Sehore', pincode: '466001', geo: GEO.sehore };
  const dhar = { city: 'Dhar', district: 'Dhar', pincode: '454001', geo: GEO.dhar };
  const depalpur = { city: 'Depalpur', district: 'Indore', pincode: '453115', geo: GEO.depalpur };
  const betma = { city: 'Betma', district: 'Indore', pincode: '453331', geo: GEO.betma };

  console.log('→ inserting lots across grains');
  const lots = [
    // WHEAT
    buildLot({
      brokerId: b0,
      seller: FARMERS.ramesh,
      grain: 'wheat',
      variety: 'Lokwan',
      qty: 120,
      pricePaise: 252000,
      quality: { moisture: 11.2, fm: 0.8, broken: 1.5, protein: 11.8 },
      pickup: indore,
      daysFromNow: 2,
    }),
    buildLot({
      brokerId: b1,
      seller: FARMERS.suresh,
      grain: 'wheat',
      variety: 'Sharbati',
      qty: 60,
      pricePaise: 318500,
      quality: { moisture: 10.4, fm: 0.5, broken: 1.1, protein: 12.5 },
      pickup: depalpur,
      daysFromNow: 4,
    }),
    buildLot({
      brokerId: b1,
      seller: FARMERS.pankaj,
      grain: 'wheat',
      variety: 'Lokwan',
      qty: 150,
      pricePaise: 249000,
      quality: { moisture: 11.6, fm: 1.0, broken: 1.4 },
      pickup: betma,
      daysFromNow: 5,
    }),
    buildLot({
      brokerId: b0,
      seller: FARMERS.manoj,
      grain: 'wheat',
      variety: 'MP Sihore',
      qty: 200,
      pricePaise: 268000,
      quality: { moisture: 11.8, fm: 1.1, broken: 1.8 },
      pickup: mhow,
      daysFromNow: 1,
    }),

    // SOYBEAN
    buildLot({
      brokerId: b2,
      seller: FARMERS.sushil,
      grain: 'soybean',
      variety: 'JS-9560',
      qty: 180,
      pricePaise: 482000,
      quality: { moisture: 9.5, fm: 0.6, broken: 0.8 },
      pickup: dewas,
      daysFromNow: 1,
    }),
    buildLot({
      brokerId: b0,
      seller: FARMERS.ramesh,
      grain: 'soybean',
      variety: 'NRC-86',
      qty: 250,
      pricePaise: 495000,
      quality: { moisture: 9.8, fm: 0.7, broken: 1.0 },
      pickup: indore,
      daysFromNow: 3,
    }),
    buildLot({
      brokerId: b1,
      seller: FARMERS.kailash,
      grain: 'soybean',
      variety: 'JS-2034',
      qty: 100,
      pricePaise: 470000,
      quality: { moisture: 10.1, fm: 0.9, broken: 1.2 },
      pickup: { city: 'Sanwer', district: 'Indore', pincode: '453551', geo: GEO.depalpur },
      daysFromNow: 4,
    }),
    buildLot({
      brokerId: b2,
      seller: FARMERS.hari,
      grain: 'soybean',
      variety: 'JS-93-05',
      qty: 140,
      pricePaise: 488000,
      quality: { moisture: 9.7, fm: 0.7, broken: 0.9 },
      pickup: mhow,
      daysFromNow: 2,
    }),

    // CHANA
    buildLot({
      brokerId: b0,
      seller: FARMERS.prakash,
      grain: 'chana',
      variety: 'Desi',
      qty: 90,
      pricePaise: 605000,
      quality: { moisture: 10.5, fm: 0.5, broken: 1.0 },
      pickup: ujjain,
      daysFromNow: 3,
    }),
    buildLot({
      brokerId: b2,
      seller: FARMERS.dinesh,
      grain: 'chana',
      variety: 'Kabuli',
      qty: 60,
      pricePaise: 690000,
      quality: { moisture: 10.2, fm: 0.4, broken: 0.8 },
      pickup: dhar,
      daysFromNow: 6,
    }),
    buildLot({
      brokerId: b1,
      seller: FARMERS.suresh,
      grain: 'chana',
      variety: 'Vishal',
      qty: 110,
      pricePaise: 615000,
      quality: { moisture: 10.7, fm: 0.6, broken: 1.1 },
      pickup: depalpur,
      daysFromNow: 4,
    }),

    // MAIZE
    buildLot({
      brokerId: b2,
      seller: FARMERS.sushil,
      grain: 'maize',
      variety: 'Yellow',
      qty: 300,
      pricePaise: 220000,
      quality: { moisture: 13.0, fm: 1.2, broken: 2.0 },
      pickup: dewas,
      daysFromNow: 2,
    }),
    buildLot({
      brokerId: b0,
      seller: FARMERS.hari,
      grain: 'maize',
      variety: 'Hybrid',
      qty: 220,
      pricePaise: 235000,
      quality: { moisture: 12.5, fm: 1.0, broken: 1.5 },
      pickup: mhow,
      daysFromNow: 3,
    }),
    buildLot({
      brokerId: b1,
      seller: FARMERS.pankaj,
      grain: 'maize',
      variety: 'White',
      qty: 80,
      pricePaise: 245000,
      quality: { moisture: 12.8, fm: 0.9, broken: 1.3 },
      pickup: betma,
      daysFromNow: 5,
    }),

    // MUSTARD
    buildLot({
      brokerId: b0,
      seller: FARMERS.ravi,
      grain: 'mustard',
      variety: 'Black (Kali Sarson)',
      qty: 70,
      pricePaise: 580000,
      quality: { moisture: 8.5, fm: 0.4, broken: 0.5 },
      pickup: sehore,
      daysFromNow: 2,
    }),
    buildLot({
      brokerId: b2,
      seller: FARMERS.dinesh,
      grain: 'mustard',
      variety: 'Yellow (Pili Sarson)',
      qty: 50,
      pricePaise: 615000,
      quality: { moisture: 8.2, fm: 0.3, broken: 0.4 },
      pickup: dhar,
      daysFromNow: 4,
    }),

    // JOWAR
    buildLot({
      brokerId: b1,
      seller: FARMERS.kailash,
      grain: 'jowar',
      variety: 'White Jowar',
      qty: 90,
      pricePaise: 318000,
      quality: { moisture: 11.0, fm: 0.8, broken: 1.2 },
      pickup: { city: 'Sanwer', district: 'Indore', pincode: '453551', geo: GEO.depalpur },
      daysFromNow: 3,
    }),

    // BAJRA
    buildLot({
      brokerId: b2,
      seller: FARMERS.sushil,
      grain: 'bajra',
      variety: 'Hybrid',
      qty: 130,
      pricePaise: 258000,
      quality: { moisture: 11.5, fm: 1.0, broken: 1.4 },
      pickup: dewas,
      daysFromNow: 3,
    }),

    // RICE
    buildLot({
      brokerId: b0,
      seller: FARMERS.prakash,
      grain: 'rice',
      variety: 'Basmati',
      qty: 100,
      pricePaise: 348000,
      quality: { moisture: 12.0, fm: 0.5, broken: 1.0 },
      pickup: ujjain,
      daysFromNow: 4,
    }),
    buildLot({
      brokerId: b1,
      seller: FARMERS.suresh,
      grain: 'rice',
      variety: 'Sona Masuri',
      qty: 75,
      pricePaise: 305000,
      quality: { moisture: 12.5, fm: 0.6, broken: 1.5 },
      pickup: depalpur,
      daysFromNow: 5,
      status: 'reserved',
    }),

    // Drafts (broker still putting them together)
    buildLot({
      brokerId: b0,
      seller: FARMERS.ramesh,
      grain: 'wheat',
      variety: 'Sharbati',
      qty: 45,
      pricePaise: 325000,
      quality: { moisture: 10.2, fm: 0.4, broken: 0.9, protein: 12.9 },
      pickup: indore,
      daysFromNow: 7,
      status: 'draft',
    }),
  ];
  const inserted = await LotModel.insertMany(lots);
  console.log(`  lots=${inserted.length}`);

  console.log('→ inserting price ticks across grains');
  // [grain, mandi, variety, min, modal, max] — all in paise per quintal
  type T = {
    grain: Grain;
    mandi:
      | 'indore_chhawni'
      | 'indore_laxmibai_nagar'
      | 'mhow'
      | 'dewas'
      | 'dhar'
      | 'ujjain'
      | 'sehore';
    variety: string;
    min: number;
    modal: number;
    max: number;
  };
  const ticks: T[] = [
    // wheat
    {
      grain: 'wheat',
      mandi: 'indore_chhawni',
      variety: 'Lokwan',
      min: 248000,
      modal: 252000,
      max: 258000,
    },
    {
      grain: 'wheat',
      mandi: 'indore_chhawni',
      variety: 'Sharbati',
      min: 312000,
      modal: 320000,
      max: 332000,
    },
    {
      grain: 'wheat',
      mandi: 'indore_chhawni',
      variety: 'MP Sihore',
      min: 261000,
      modal: 268000,
      max: 275000,
    },
    {
      grain: 'wheat',
      mandi: 'indore_laxmibai_nagar',
      variety: 'Lokwan',
      min: 249000,
      modal: 253000,
      max: 259000,
    },
    {
      grain: 'wheat',
      mandi: 'dewas',
      variety: 'Sharbati',
      min: 308000,
      modal: 318000,
      max: 328000,
    },
    { grain: 'wheat', mandi: 'ujjain', variety: 'Lokwan', min: 247000, modal: 251000, max: 257000 },

    // soybean
    {
      grain: 'soybean',
      mandi: 'indore_chhawni',
      variety: 'JS-9560',
      min: 475000,
      modal: 485000,
      max: 498000,
    },
    {
      grain: 'soybean',
      mandi: 'indore_chhawni',
      variety: 'NRC-86',
      min: 482000,
      modal: 495000,
      max: 510000,
    },
    {
      grain: 'soybean',
      mandi: 'dewas',
      variety: 'JS-9560',
      min: 470000,
      modal: 482000,
      max: 495000,
    },
    {
      grain: 'soybean',
      mandi: 'ujjain',
      variety: 'JS-2034',
      min: 460000,
      modal: 470000,
      max: 482000,
    },

    // chana
    {
      grain: 'chana',
      mandi: 'indore_chhawni',
      variety: 'Desi',
      min: 595000,
      modal: 605000,
      max: 618000,
    },
    {
      grain: 'chana',
      mandi: 'indore_chhawni',
      variety: 'Kabuli',
      min: 670000,
      modal: 690000,
      max: 710000,
    },
    { grain: 'chana', mandi: 'dewas', variety: 'Desi', min: 590000, modal: 600000, max: 615000 },
    { grain: 'chana', mandi: 'ujjain', variety: 'Desi', min: 600000, modal: 608000, max: 620000 },

    // maize
    {
      grain: 'maize',
      mandi: 'indore_chhawni',
      variety: 'Yellow',
      min: 215000,
      modal: 220000,
      max: 230000,
    },
    { grain: 'maize', mandi: 'dewas', variety: 'Hybrid', min: 225000, modal: 232000, max: 240000 },
    { grain: 'maize', mandi: 'mhow', variety: 'White', min: 235000, modal: 244000, max: 252000 },

    // mustard
    {
      grain: 'mustard',
      mandi: 'indore_chhawni',
      variety: 'Black (Kali Sarson)',
      min: 570000,
      modal: 580000,
      max: 595000,
    },
    {
      grain: 'mustard',
      mandi: 'sehore',
      variety: 'Black (Kali Sarson)',
      min: 575000,
      modal: 585000,
      max: 600000,
    },
    {
      grain: 'mustard',
      mandi: 'dhar',
      variety: 'Yellow (Pili Sarson)',
      min: 605000,
      modal: 615000,
      max: 628000,
    },

    // jowar
    {
      grain: 'jowar',
      mandi: 'indore_chhawni',
      variety: 'White Jowar',
      min: 312000,
      modal: 320000,
      max: 330000,
    },
    { grain: 'jowar', mandi: 'dewas', variety: 'Hybrid', min: 295000, modal: 305000, max: 318000 },

    // bajra
    {
      grain: 'bajra',
      mandi: 'indore_chhawni',
      variety: 'Hybrid',
      min: 252000,
      modal: 258000,
      max: 268000,
    },
    { grain: 'bajra', mandi: 'dewas', variety: 'Local', min: 245000, modal: 252000, max: 262000 },

    // rice
    {
      grain: 'rice',
      mandi: 'indore_chhawni',
      variety: 'Basmati',
      min: 340000,
      modal: 348000,
      max: 360000,
    },
    {
      grain: 'rice',
      mandi: 'ujjain',
      variety: 'Sona Masuri',
      min: 298000,
      modal: 305000,
      max: 315000,
    },
  ];
  await PriceTickModel.insertMany(
    ticks.map((t) => ({
      grain: t.grain,
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

  console.log('\n✓ seed complete. Demo accounts:');
  console.log(`  admin   : ${USERS.admin.phone}  (${USERS.admin.name})`);
  console.log(`  broker  : ${USERS.brokers[0]!.phone}  (${USERS.brokers[0]!.name})`);
  console.log(`  buyer   : ${USERS.buyers[0]!.phone}  (${USERS.buyers[0]!.name})`);

  await disconnectDb();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
