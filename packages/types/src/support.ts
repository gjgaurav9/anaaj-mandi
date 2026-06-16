import { z } from 'zod';
import { ObjectIdSchema } from './common';

export const TicketCategorySchema = z.enum(['payment', 'quality', 'delivery', 'account', 'other']);
export type TicketCategory = z.infer<typeof TicketCategorySchema>;

export const TicketStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed']);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

/** Labels for the report-a-problem form. */
export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  payment: 'Payment issue',
  quality: 'Grain quality',
  delivery: 'Delivery problem',
  account: 'Account / login',
  other: 'Something else',
};

export const SupportTicketSchema = z.object({
  _id: ObjectIdSchema,
  user_id: ObjectIdSchema,
  role: z.enum(['broker', 'buyer', 'admin']),
  category: TicketCategorySchema,
  message: z.string().min(5).max(1000),
  related_lot_id: ObjectIdSchema.optional(),
  related_broker_id: ObjectIdSchema.optional(),
  status: TicketStatusSchema,
  admin_note: z.string().max(1000).optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type SupportTicket = z.infer<typeof SupportTicketSchema>;

/** POST /support/tickets body. */
export const CreateTicketInputSchema = z.object({
  category: TicketCategorySchema,
  message: z.string().min(5, 'Please describe the problem').max(1000),
  related_lot_id: ObjectIdSchema.optional(),
  related_broker_id: ObjectIdSchema.optional(),
});
export type CreateTicketInput = z.infer<typeof CreateTicketInputSchema>;

/** Admin-only ticket update. */
export const UpdateTicketInputSchema = z.object({
  status: TicketStatusSchema,
  admin_note: z.string().max(1000).optional(),
});
export type UpdateTicketInput = z.infer<typeof UpdateTicketInputSchema>;
