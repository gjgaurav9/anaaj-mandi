import { z } from 'zod';
import {
  GeoPointSchema,
  GrainSchema,
  HttpsUrlSchema,
  ObjectIdSchema,
  PaiseSchema,
  PhoneSchema,
  PincodeSchema,
  QuintalSchema,
  VarietySchema,
} from './common.js';

export const LotStatusSchema = z.enum(['draft', 'active', 'reserved', 'sold', 'expired']);
export type LotStatus = z.infer<typeof LotStatusSchema>;

export const LotQualitySchema = z.object({
  moisture_pct: z.number().min(0).max(30),
  foreign_matter_pct: z.number().min(0).max(20),
  broken_pct: z.number().min(0).max(20),
  protein_pct: z.number().min(0).max(20).optional(),
});
export type LotQuality = z.infer<typeof LotQualitySchema>;

/** Farmer info captured by the broker offline. The farmer is NOT a User. */
export const EmbeddedSellerSchema = z.object({
  name: z.string().min(2).max(80),
  phone: PhoneSchema,
  village: z.string().max(80).optional(),
});
export type EmbeddedSeller = z.infer<typeof EmbeddedSellerSchema>;

export const LotPickupLocationSchema = z.object({
  city: z.string().min(2).max(80),
  district: z.string().min(2).max(80),
  pincode: PincodeSchema,
  geo: GeoPointSchema,
});
export type LotPickupLocation = z.infer<typeof LotPickupLocationSchema>;

/** Full lot document as stored / returned by the API. */
export const LotSchema = z.object({
  _id: ObjectIdSchema,
  broker_id: ObjectIdSchema,
  seller: EmbeddedSellerSchema,
  grain: GrainSchema,
  variety: VarietySchema,
  quantity_quintals: QuintalSchema.refine((n) => n >= 10, { message: 'min 10 quintals' }),
  price_per_quintal: PaiseSchema,
  quality: LotQualitySchema,
  photos: z.array(HttpsUrlSchema).min(1).max(5),
  pickup_location: LotPickupLocationSchema,
  available_from: z.coerce.date(),
  status: LotStatusSchema.default('draft'),
  view_count: z.number().int().nonnegative().default(0),
  inquiry_count: z.number().int().nonnegative().default(0),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Lot = z.infer<typeof LotSchema>;

/** POST /lots input — broker fills the rest. */
export const CreateLotInputSchema = LotSchema.pick({
  variety: true,
  quantity_quintals: true,
  price_per_quintal: true,
  quality: true,
  pickup_location: true,
  available_from: true,
  seller: true,
}).extend({
  grain: GrainSchema.default('wheat'),
  /** Drafts may have no photos; required before going active (server-enforced). */
  photos: z.array(HttpsUrlSchema).max(5).default([]),
  status: z.enum(['draft', 'active']).default('draft'),
});
export type CreateLotInput = z.infer<typeof CreateLotInputSchema>;

export const UpdateLotInputSchema = CreateLotInputSchema.partial().extend({
  status: LotStatusSchema.optional(),
});
export type UpdateLotInput = z.infer<typeof UpdateLotInputSchema>;

/** GET /lots query string — filters + pagination. */
export const ListLotsQuerySchema = z.object({
  variety: VarietySchema.optional(),
  min_qty: z.coerce.number().positive().optional(),
  max_qty: z.coerce.number().positive().optional(),
  min_price: z.coerce.number().int().nonnegative().optional(),
  max_price: z.coerce.number().int().nonnegative().optional(),
  near_lat: z.coerce.number().min(-90).max(90).optional(),
  near_lng: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce.number().positive().max(2000).optional(),
  status: LotStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ListLotsQuery = z.infer<typeof ListLotsQuerySchema>;

export const AttachPhotosInputSchema = z.object({
  urls: z.array(HttpsUrlSchema).min(1).max(5),
});
export type AttachPhotosInput = z.infer<typeof AttachPhotosInputSchema>;
