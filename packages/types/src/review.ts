import { z } from 'zod';
import { ObjectIdSchema } from './common';

const Score = z.number().int().min(1).max(5);

/** The four dimensions a buyer rates a broker on. */
export const ReviewScoresSchema = z.object({
  payment_on_time: Score,
  quality_match: Score,
  delivery: Score,
  ease_of_deal: Score,
});
export type ReviewScores = z.infer<typeof ReviewScoresSchema>;

/** Human labels for each dimension (used in the rating UI). */
export const REVIEW_DIMENSIONS: Array<{ key: keyof ReviewScores; label: string }> = [
  { key: 'payment_on_time', label: 'Payment on time' },
  { key: 'quality_match', label: 'Grain quality matched description' },
  { key: 'delivery', label: 'Delivery / pickup smooth' },
  { key: 'ease_of_deal', label: 'Ease of the deal' },
];

export const ReviewSchema = z.object({
  _id: ObjectIdSchema,
  broker_id: ObjectIdSchema,
  buyer_id: ObjectIdSchema,
  lot_id: ObjectIdSchema.optional(),
  scores: ReviewScoresSchema,
  overall: z.number().min(1).max(5),
  comment: z.string().max(600),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Review = z.infer<typeof ReviewSchema>;

/** POST /reviews body — buyer_id is filled server-side, overall is computed. */
export const CreateReviewInputSchema = z.object({
  broker_id: ObjectIdSchema,
  lot_id: ObjectIdSchema.optional(),
  scores: ReviewScoresSchema,
  comment: z.string().max(600).default(''),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>;
