import { z } from 'zod';
import { GrainSchema, MandiSchema, ObjectIdSchema, PaiseSchema, VarietySchema } from './common.js';

export const PriceSourceSchema = z.enum(['agmarknet', 'manual']);
export type PriceSource = z.infer<typeof PriceSourceSchema>;

export const PriceTickSchema = z
  .object({
    _id: ObjectIdSchema,
    grain: GrainSchema,
    mandi: MandiSchema,
    variety: VarietySchema,
    price_min: PaiseSchema,
    price_max: PaiseSchema,
    price_modal: PaiseSchema,
    source: PriceSourceSchema,
    date: z.coerce.date(),
  })
  .refine((t) => t.price_min <= t.price_modal && t.price_modal <= t.price_max, {
    message: 'expected price_min ≤ price_modal ≤ price_max',
    path: ['price_modal'],
  });
export type PriceTick = z.infer<typeof PriceTickSchema>;

/** Admin manual entry payload. */
export const CreatePriceTickInputSchema = z
  .object({
    grain: GrainSchema.default('wheat'),
    mandi: MandiSchema,
    variety: VarietySchema,
    price_min: PaiseSchema,
    price_max: PaiseSchema,
    price_modal: PaiseSchema,
    /** Defaults to today; explicit when backfilling. */
    date: z.coerce.date().optional(),
  })
  .refine((t) => t.price_min <= t.price_modal && t.price_modal <= t.price_max, {
    message: 'expected price_min ≤ price_modal ≤ price_max',
    path: ['price_modal'],
  });
export type CreatePriceTickInput = z.infer<typeof CreatePriceTickInputSchema>;
