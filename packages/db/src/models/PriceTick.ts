import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import type { Variety } from './Lot.js';

export type Mandi =
  | 'indore_chhawni'
  | 'indore_laxmibai_nagar'
  | 'mhow'
  | 'dewas'
  | 'dhar'
  | 'ujjain'
  | 'sehore'
  | 'other';

export type PriceSource = 'agmarknet' | 'manual';

export interface IPriceTick {
  grain: 'wheat';
  mandi: Mandi;
  variety: Variety;
  /** integer paise */
  price_min: number;
  price_max: number;
  price_modal: number;
  source: PriceSource;
  date: Date;
}

const priceTickSchema = new Schema<IPriceTick>(
  {
    grain: { type: String, enum: ['wheat'], required: true, default: 'wheat' },
    mandi: {
      type: String,
      enum: [
        'indore_chhawni',
        'indore_laxmibai_nagar',
        'mhow',
        'dewas',
        'dhar',
        'ujjain',
        'sehore',
        'other',
      ],
      required: true,
    },
    variety: {
      type: String,
      enum: ['lokwan', 'sharbati', 'sehore', 'mp_sihore', 'other'],
      required: true,
    },
    price_min: { type: Number, required: true, min: 0 },
    price_max: { type: Number, required: true, min: 0 },
    price_modal: { type: Number, required: true, min: 0 },
    source: { type: String, enum: ['agmarknet', 'manual'], required: true },
    date: { type: Date, required: true, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'price_ticks',
  },
);

priceTickSchema.index({ mandi: 1, variety: 1, date: 1 }, { unique: true });

export type PriceTickDoc = HydratedDocument<IPriceTick> & { _id: Types.ObjectId };

export const PriceTickModel: Model<IPriceTick> = model<IPriceTick>('PriceTick', priceTickSchema);
