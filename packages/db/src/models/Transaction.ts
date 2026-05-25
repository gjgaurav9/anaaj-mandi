import { Schema, model, Types, type InferSchemaType, type Model } from 'mongoose';

const transactionSchema = new Schema(
  {
    lot_id: { type: Types.ObjectId, ref: 'Lot', required: true, index: true },
    buyer_id: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    seller_id: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    broker_id: { type: Types.ObjectId, ref: 'User' },
    quantity_quintals: { type: Number, required: true, min: 0 },
    price_per_quintal: { type: Number, required: true, min: 0 },
    /** quantity_quintals * price_per_quintal, computed server-side at create. */
    total_amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['agreed', 'shipped', 'delivered', 'disputed', 'cancelled'],
      default: 'agreed',
      required: true,
    },
    platform_fee: { type: Number, default: 0, min: 0 },
    recorded_by: { type: Types.ObjectId, ref: 'User', required: true },
    recorded_at: { type: Date, required: true, default: () => new Date() },
  },
  {
    timestamps: { createdAt: false, updatedAt: 'updated_at' },
    collection: 'transactions',
  },
);

export type TransactionDoc = InferSchemaType<typeof transactionSchema>;

export const TransactionModel: Model<TransactionDoc> = model<TransactionDoc>(
  'Transaction',
  transactionSchema,
);
