import { Schema, model, Types, type InferSchemaType, type Model } from 'mongoose';

const inquirySchema = new Schema(
  {
    lot_id: { type: Types.ObjectId, ref: 'Lot', required: true, index: true },
    buyer_id: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    seller_id: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: ['sent', 'viewed', 'replied', 'closed'],
      default: 'sent',
      required: true,
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'call', 'platform'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'inquiries',
  },
);

// (buyer_id, lot_id) is what the 24h dedupe service queries against.
// Not unique — a buyer can inquire again on the same lot after 24h.
inquirySchema.index({ buyer_id: 1, lot_id: 1, created_at: -1 });

export type InquiryDoc = InferSchemaType<typeof inquirySchema>;

export const InquiryModel: Model<InquiryDoc> = model<InquiryDoc>('Inquiry', inquirySchema);
