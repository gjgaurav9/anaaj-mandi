import { Schema, model, Types, type InferSchemaType, type Model } from 'mongoose';

const qualitySchema = new Schema(
  {
    moisture_pct: { type: Number, required: true, min: 0, max: 30 },
    foreign_matter_pct: { type: Number, required: true, min: 0, max: 20 },
    broken_pct: { type: Number, required: true, min: 0, max: 20 },
    protein_pct: { type: Number, min: 0, max: 20 },
  },
  { _id: false },
);

const pickupLocationSchema = new Schema(
  {
    city: { type: String, required: true },
    district: { type: String, required: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    geo: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (v: number[]) => v.length === 2,
          message: 'coordinates must be [lng, lat]',
        },
      },
    },
  },
  { _id: false },
);

const lotSchema = new Schema(
  {
    seller_id: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    broker_id: { type: Types.ObjectId, ref: 'User', index: true },
    grain: { type: String, enum: ['wheat'], required: true, default: 'wheat' },
    variety: {
      type: String,
      enum: ['lokwan', 'sharbati', 'sehore', 'mp_sihore', 'other'],
      required: true,
    },
    quantity_quintals: { type: Number, required: true, min: 10 },
    /** Stored as integer paise. */
    price_per_quintal: { type: Number, required: true, min: 0 },
    quality: { type: qualitySchema, required: true },
    photos: {
      type: [String],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: 'max 5 photos',
      },
      default: [],
    },
    pickup_location: { type: pickupLocationSchema, required: true },
    available_from: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'reserved', 'sold', 'expired'],
      default: 'draft',
      required: true,
      index: true,
    },
    view_count: { type: Number, default: 0, min: 0 },
    inquiry_count: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'lots',
  },
);

// Geospatial radius search on pickup_location.geo
lotSchema.index({ 'pickup_location.geo': '2dsphere' });
// Text search across variety + city
lotSchema.index({ variety: 'text', 'pickup_location.city': 'text' });

export type LotDoc = InferSchemaType<typeof lotSchema>;

export const LotModel: Model<LotDoc> = model<LotDoc>('Lot', lotSchema);
