import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export type TransactionStatus = 'agreed' | 'shipped' | 'delivered' | 'disputed' | 'cancelled';

export interface ITransaction {
  lot_id: Types.ObjectId;
  buyer_id: Types.ObjectId;
  broker_id: Types.ObjectId;
  /** Snapshot at time of sale — frozen even if the broker edits the lot. */
  seller_name: string;
  seller_phone: string;
  quantity_quintals: number;
  price_per_quintal: number;
  total_amount: number;
  status: TransactionStatus;
  platform_fee: number;
  recorded_by: Types.ObjectId;
  recorded_at: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    lot_id: { type: Schema.Types.ObjectId, ref: 'Lot', required: true, index: true },
    buyer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    broker_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller_name: { type: String, required: true, minlength: 2, maxlength: 80 },
    seller_phone: { type: String, required: true, match: /^\+91[6-9]\d{9}$/ },
    quantity_quintals: { type: Number, required: true, min: 0 },
    price_per_quintal: { type: Number, required: true, min: 0 },
    total_amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['agreed', 'shipped', 'delivered', 'disputed', 'cancelled'],
      default: 'agreed',
      required: true,
    },
    platform_fee: { type: Number, default: 0, min: 0 },
    recorded_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recorded_at: { type: Date, required: true, default: () => new Date() },
  },
  {
    timestamps: { createdAt: false, updatedAt: 'updated_at' },
    collection: 'transactions',
  },
);

export type TransactionDoc = HydratedDocument<ITransaction> & { _id: Types.ObjectId };

export const TransactionModel: Model<ITransaction> = model<ITransaction>(
  'Transaction',
  transactionSchema,
);
