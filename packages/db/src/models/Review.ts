import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

/**
 * A buyer's review of a broker after dealing with them. Each dimension mirrors
 * a concrete pain point buyers care about (payment, quality match, delivery),
 * plus an overall "ease of the deal" feel. Scores are 1–5.
 */
export interface IReviewScores {
  payment_on_time: number;
  quality_match: number;
  delivery: number;
  ease_of_deal: number;
}

export interface IReview {
  broker_id: Types.ObjectId;
  buyer_id: Types.ObjectId;
  /** Optional lot this review is anchored to. */
  lot_id?: Types.ObjectId;
  scores: IReviewScores;
  /** Mean of the four dimension scores — stored for cheap sorting. */
  overall: number;
  comment: string;
  created_at: Date;
  updated_at: Date;
}

const scoreField = { type: Number, required: true, min: 1, max: 5 };

const scoresSchema = new Schema<IReviewScores>(
  {
    payment_on_time: scoreField,
    quality_match: scoreField,
    delivery: scoreField,
    ease_of_deal: scoreField,
  },
  { _id: false },
);

const reviewSchema = new Schema<IReview>(
  {
    broker_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lot_id: { type: Schema.Types.ObjectId, ref: 'Lot' },
    scores: { type: scoresSchema, required: true },
    overall: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 600, default: '' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'reviews',
  },
);

// One review per buyer per broker — updating just overwrites the existing row.
reviewSchema.index({ broker_id: 1, buyer_id: 1 }, { unique: true });

export type ReviewDoc = HydratedDocument<IReview> & { _id: Types.ObjectId };

export const ReviewModel: Model<IReview> = model<IReview>('Review', reviewSchema);
