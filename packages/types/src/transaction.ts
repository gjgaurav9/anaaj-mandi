import { z } from 'zod';
import { ObjectIdSchema, PaiseSchema, PhoneSchema, QuintalSchema } from './common';

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
  broker_id: ObjectIdSchema,
  /** Snapshot of the farmer's name + phone at the time of sale. */
  seller_name: z.string().min(2).max(80),
  seller_phone: PhoneSchema,
  quantity_quintals: QuintalSchema,
  price_per_quintal: PaiseSchema,
  total_amount: PaiseSchema,
  status: TransactionStatusSchema.default('agreed'),
  platform_fee: PaiseSchema.default(0),
  recorded_by: ObjectIdSchema,
  recorded_at: z.coerce.date(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const CreateTransactionInputSchema = z.object({
  lot_id: ObjectIdSchema,
  buyer_id: ObjectIdSchema,
  quantity_quintals: QuintalSchema,
  price_per_quintal: PaiseSchema,
  status: TransactionStatusSchema.optional(),
});
export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>;
