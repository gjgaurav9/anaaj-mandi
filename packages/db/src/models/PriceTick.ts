import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const priceTickSchema = new Schema(
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
    /** All prices stored as integer paise per quintal. */
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

export type PriceTickDoc = InferSchemaType<typeof priceTickSchema>;

export const PriceTickModel: Model<PriceTickDoc> = model<PriceTickDoc>(
  'PriceTick',
  priceTickSchema,
);
