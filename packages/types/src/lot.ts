import { z } from 'zod';
import {
  GeoPointSchema,
  GrainSchema,
  HttpsUrlSchema,
  ObjectIdSchema,
  PaiseSchema,
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
  seller_id: ObjectIdSchema,
  broker_id: ObjectIdSchema.optional(),
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

/** POST /lots input — server fills the rest. */
export const CreateLotInputSchema = LotSchema.pick({
  variety: true,
  quantity_quintals: true,
  price_per_quintal: true,
  quality: true,
  pickup_location: true,
  available_from: true,
}).extend({
  /** Always wheat in v1; optional in body, defaults server-side. */
  grain: GrainSchema.default('wheat'),
  /** Empty allowed at create; photos can be added via /lots/:id/photos. */
  photos: z.array(HttpsUrlSchema).max(5).default([]),
  /** Brokers can pass a seller_id they're listing on behalf of. */
  seller_id: ObjectIdSchema.optional(),
  /** Brokers may self-attach when creating. */
  broker_id: ObjectIdSchema.optional(),
  /** Sellers can save a draft and publish later. */
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

/** POST /lots/:id/photos — body sent after browser uploads to Cloudinary. */
export const AttachPhotosInputSchema = z.object({
  urls: z.array(HttpsUrlSchema).min(1).max(5),
});
export type AttachPhotosInput = z.infer<typeof AttachPhotosInputSchema>;
