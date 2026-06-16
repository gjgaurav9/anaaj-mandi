import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export type TicketCategory = 'payment' | 'quality' | 'delivery' | 'account' | 'other';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface ISupportTicket {
  user_id: Types.ObjectId;
  /** Role of the reporter at the time, so admin can triage without a join. */
  role: 'broker' | 'buyer' | 'admin';
  category: TicketCategory;
  message: string;
  /** Optional context the reporter was looking at. */
  related_lot_id?: Types.ObjectId;
  related_broker_id?: Types.ObjectId;
  status: TicketStatus;
  /** Admin's last note back to the reporter. */
  admin_note?: string;
  created_at: Date;
  updated_at: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['broker', 'buyer', 'admin'], required: true },
    category: {
      type: String,
      enum: ['payment', 'quality', 'delivery', 'account', 'other'],
      required: true,
    },
    message: { type: String, required: true, minlength: 5, maxlength: 1000 },
    related_lot_id: { type: Schema.Types.ObjectId, ref: 'Lot' },
    related_broker_id: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      required: true,
      index: true,
    },
    admin_note: { type: String, maxlength: 1000 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'support_tickets',
  },
);

supportTicketSchema.index({ user_id: 1, created_at: -1 });

export type SupportTicketDoc = HydratedDocument<ISupportTicket> & { _id: Types.ObjectId };

export const SupportTicketModel: Model<ISupportTicket> = model<ISupportTicket>(
  'SupportTicket',
  supportTicketSchema,
);
