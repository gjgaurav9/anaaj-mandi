import { z } from 'zod';
import { ObjectIdSchema } from './common.js';

export const InquiryStatusSchema = z.enum(['sent', 'viewed', 'replied', 'closed']);
export type InquiryStatus = z.infer<typeof InquiryStatusSchema>;

export const InquiryChannelSchema = z.enum(['whatsapp', 'call', 'platform']);
export type InquiryChannel = z.infer<typeof InquiryChannelSchema>;

export const InquirySchema = z.object({
  _id: ObjectIdSchema,
  lot_id: ObjectIdSchema,
  buyer_id: ObjectIdSchema,
  /** Broker who listed the lot — the actual person the buyer talks to. */
  broker_id: ObjectIdSchema,
  message: z.string().max(500),
  status: InquiryStatusSchema.default('sent'),
  channel: InquiryChannelSchema,
  created_at: z.coerce.date(),
});
export type Inquiry = z.infer<typeof InquirySchema>;

/** POST /inquiries body. buyer_id + broker_id are filled server-side. */
export const CreateInquiryInputSchema = z.object({
  lot_id: ObjectIdSchema,
  message: z.string().max(500).default(''),
  channel: InquiryChannelSchema,
});
export type CreateInquiryInput = z.infer<typeof CreateInquiryInputSchema>;

export const UpdateInquiryStatusInputSchema = z.object({
  status: InquiryStatusSchema,
});
export type UpdateInquiryStatusInput = z.infer<typeof UpdateInquiryStatusInputSchema>;
