import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import type { IGeoPoint } from './User.js';

/** Grains traded through Indore-region mandis. */
export type Grain =
  | 'wheat'
  | 'soybean'
  | 'chana'
  | 'maize'
  | 'mustard'
  | 'jowar'
  | 'bajra'
  | 'rice'
  | 'other';

export const GRAINS: Grain[] = [
  'wheat',
  'soybean',
  'chana',
  'maize',
  'mustard',
  'jowar',
  'bajra',
  'rice',
  'other',
];

/** Variety is free-form per grain. Frontend offers suggestions; brokers may type custom. */
export type Variety = string;
export type LotStatus = 'draft' | 'active' | 'reserved' | 'sold' | 'expired';

export interface ILotQuality {
  moisture_pct: number;
  foreign_matter_pct: number;
  broken_pct: number;
  protein_pct?: number;
}

/** Farmer contact captured offline by the broker. Not a User. */
export interface IEmbeddedSeller {
  name: string;
  phone: string; // E.164
  village?: string;
}

export interface ILotPickupLocation {
  city: string;
  district: string;
  pincode: string;
  geo: IGeoPoint;
}

export interface ILot {
  broker_id: Types.ObjectId;
  seller: IEmbeddedSeller;
  grain: Grain;
  variety: Variety;
  quantity_quintals: number;
  /** integer paise */
  price_per_quintal: number;
  quality: ILotQuality;
  photos: string[];
  pickup_location: ILotPickupLocation;
  available_from: Date;
  status: LotStatus;
  view_count: number;
  inquiry_count: number;
  created_at: Date;
  updated_at: Date;
}

const qualitySchema = new Schema<ILotQuality>(
  {
    moisture_pct: { type: Number, required: true, min: 0, max: 30 },
    foreign_matter_pct: { type: Number, required: true, min: 0, max: 20 },
    broken_pct: { type: Number, required: true, min: 0, max: 20 },
    protein_pct: { type: Number, min: 0, max: 20 },
  },
  { _id: false },
);

const embeddedSellerSchema = new Schema<IEmbeddedSeller>(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 80 },
    phone: { type: String, required: true, match: /^\+91[6-9]\d{9}$/ },
    village: { type: String, maxlength: 80 },
  },
  { _id: false },
);

const pickupLocationSchema = new Schema<ILotPickupLocation>(
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

const lotSchema = new Schema<ILot>(
  {
    broker_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: embeddedSellerSchema, required: true },
    grain: { type: String, enum: GRAINS, required: true, default: 'wheat', index: true },
    variety: { type: String, required: true, trim: true, minlength: 1, maxlength: 50 },
    quantity_quintals: { type: Number, required: true, min: 10 },
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

lotSchema.index({ 'pickup_location.geo': '2dsphere' });
lotSchema.index({ grain: 1, variety: 1, status: 1 });
lotSchema.index({ variety: 'text', 'pickup_location.city': 'text', 'seller.name': 'text' });

export type LotDoc = HydratedDocument<ILot> & { _id: Types.ObjectId };

export const LotModel: Model<ILot> = model<ILot>('Lot', lotSchema);
