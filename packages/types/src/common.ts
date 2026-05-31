import { z } from 'zod';

// ---------- Primitives ----------

/** MongoDB ObjectId, 24-char hex string. */
export const ObjectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'must be a 24-char hex ObjectId');

/** Indian E.164 phone: +91 followed by 10 digits starting 6-9. */
export const PhoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'must be E.164 Indian phone (+91XXXXXXXXXX)');

/** Money stored as integer paise (100 paise = 1 rupee). */
export const PaiseSchema = z.number().int().nonnegative();

/** Grain quantity in quintals (1 quintal = 100 kg). */
export const QuintalSchema = z.number().positive();

/** Indian PIN code: 6 digits. */
export const PincodeSchema = z.string().regex(/^\d{6}$/, 'must be a 6-digit PIN');

export const HttpsUrlSchema = z.string().url().startsWith('https://', 'must be https');

// ---------- GeoJSON ----------

export const GeoPointSchema = z.object({
  type: z.literal('Point'),
  /** [longitude, latitude] — note Mongo's order. */
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

// ---------- Enums ----------

// Sellers (farmers) are not app users in v1 — they're embedded on the lot.
// The role enum covers only people who actually sign in.
export const RoleSchema = z.enum(['broker', 'buyer', 'admin']);
export type Role = z.infer<typeof RoleSchema>;

/** Grains traded through Indore-region mandis. Order matters — used for landing tile order. */
export const GrainSchema = z.enum([
  'wheat',
  'soybean',
  'chana',
  'maize',
  'mustard',
  'jowar',
  'bajra',
  'rice',
  'other',
]);
export type Grain = z.infer<typeof GrainSchema>;

export const GRAIN_LABELS: Record<Grain, string> = {
  wheat: 'Wheat (Gehu)',
  soybean: 'Soybean (Soya)',
  chana: 'Chana',
  maize: 'Maize (Makka)',
  mustard: 'Mustard (Sarson)',
  jowar: 'Jowar',
  bajra: 'Bajra',
  rice: 'Rice (Chawal)',
  other: 'Other',
};

/** Visual icon shown on grain tiles + lot cards. */
export const GRAIN_EMOJI: Record<Grain, string> = {
  wheat: '🌾',
  soybean: '🫘',
  chana: '🫛',
  maize: '🌽',
  mustard: '🌼',
  jowar: '🟡',
  bajra: '🟤',
  rice: '🍚',
  other: '🌱',
};

/** Common varieties per grain, used as datalist suggestions in the create-lot form. */
export const GRAIN_VARIETY_SUGGESTIONS: Record<Grain, string[]> = {
  wheat: ['Lokwan', 'Sharbati', 'Sehore', 'MP Sihore'],
  soybean: ['JS-9560', 'NRC-86', 'JS-2034', 'JS-93-05', 'Local'],
  chana: ['Desi', 'Kabuli', 'Vishal', 'JG-11'],
  maize: ['Yellow', 'White', 'Hybrid', 'Local'],
  mustard: ['Black (Kali Sarson)', 'Yellow (Pili Sarson)', 'RH-749', 'Pusa Bold'],
  jowar: ['White Jowar', 'Yellow Jowar', 'Hybrid'],
  bajra: ['Hybrid', 'Local', 'Composite'],
  rice: ['Basmati', 'Sona Masuri', 'IR-64', 'Non-Basmati'],
  other: [],
};

/** Variety on a lot or price tick — free-form, just trimmed and length-bounded. */
export const VarietySchema = z.string().trim().min(1, 'variety is required').max(50);
export type Variety = z.infer<typeof VarietySchema>;

/** Indore-area mandis (plus 'other'). */
export const MandiSchema = z.enum([
  'indore_chhawni',
  'indore_laxmibai_nagar',
  'mhow',
  'dewas',
  'dhar',
  'ujjain',
  'sehore',
  'other',
]);
export type Mandi = z.infer<typeof MandiSchema>;

// ---------- Pagination ----------

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  has_more: z.boolean(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

// ---------- API envelope ----------

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const apiSuccess = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ ok: z.literal(true), data });

export const ApiFailureSchema = z.object({ ok: z.literal(false), error: ApiErrorSchema });
export type ApiFailure = z.infer<typeof ApiFailureSchema>;

// ---------- Money helpers ----------

/** ₹1 = 100 paise. */
export const RUPEES_TO_PAISE = 100;
/** 1 quintal = 100 kg. */
export const KG_PER_QUINTAL = 100;
