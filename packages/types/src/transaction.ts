import { z } from 'zod';
import { ObjectIdSchema, PaiseSchema, QuintalSchema } from './common.js';

export const TransactionStatusSchema = z.enum([
  'agreed',
  'shipped',
  'delivered',
  'disputed',
  'cancelled',
]);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

export const TransactionSchema = z.object({
  _id: ObjectIdSchema,
  lot_id: ObjectIdSchema,
  buyer_id: ObjectIdSchema,
  seller_id: ObjectIdSchema,
  broker_id: ObjectIdSchema.optional(),
  quantity_quintals: QuintalSchema,
  price_per_quintal: PaiseSchema,
  /** quantity_quintals * price_per_quintal — computed server-side. */
  total_amount: PaiseSchema,
  status: TransactionStatusSchema.default('agreed'),
  /** Platform fee in paise (zero in v1; field reserved for future). */
  platform_fee: PaiseSchema.default(0),
  recorded_by: ObjectIdSchema,
  recorded_at: z.coerce.date(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

/** POST /transactions — total_amount + recorded_by + recorded_at are server-set. */
export const CreateTransactionInputSchema = z.object({
  lot_id: ObjectIdSchema,
  buyer_id: ObjectIdSchema,
  seller_id: ObjectIdSchema,
  broker_id: ObjectIdSchema.optional(),
  quantity_quintals: QuintalSchema,
  price_per_quintal: PaiseSchema,
  status: TransactionStatusSchema.optional(),
});
export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>;
