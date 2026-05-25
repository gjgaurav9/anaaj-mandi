import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export type InquiryStatus = 'sent' | 'viewed' | 'replied' | 'closed';
export type InquiryChannel = 'whatsapp' | 'call' | 'platform';

export interface IInquiry {
  lot_id: Types.ObjectId;
  buyer_id: Types.ObjectId;
  seller_id: Types.ObjectId;
  message: string;
  status: InquiryStatus;
  channel: InquiryChannel;
  created_at: Date;
}

const inquirySchema = new Schema<IInquiry>(
  {
    lot_id: { type: Schema.Types.ObjectId, ref: 'Lot', required: true, index: true },
    buyer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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

inquirySchema.index({ buyer_id: 1, lot_id: 1, created_at: -1 });

export type InquiryDoc = HydratedDocument<IInquiry> & { _id: Types.ObjectId };

export const InquiryModel: Model<IInquiry> = model<IInquiry>('Inquiry', inquirySchema);
