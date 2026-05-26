import { z } from 'zod';
import {
  GeoPointSchema,
  ObjectIdSchema,
  PhoneSchema,
  PincodeSchema,
  RoleSchema,
} from './common.js';

export const KycStatusSchema = z.enum(['pending', 'verified', 'rejected']);
export type KycStatus = z.infer<typeof KycStatusSchema>;

export const KycSchema = z.object({
  status: KycStatusSchema.default('pending'),
  gst: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/, 'invalid GSTIN')
    .optional(),
  pan_last4: z
    .string()
    .regex(/^[0-9A-Z]{4}$/)
    .optional(),
  aadhaar_last4: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
  verified_at: z.coerce.date().optional(),
});
export type Kyc = z.infer<typeof KycSchema>;

export const UserLocationSchema = z.object({
  city: z.string().min(2).max(80),
  district: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: PincodeSchema,
  geo: GeoPointSchema,
});
export type UserLocation = z.infer<typeof UserLocationSchema>;

/** Full user document as stored / returned by the API. */
export const UserSchema = z.object({
  _id: ObjectIdSchema,
  phone: PhoneSchema,
  name: z.string().min(1).max(80).optional(),
  role: RoleSchema,
  kyc: KycSchema.default({ status: 'pending' }),
  location: UserLocationSchema.optional(),
  business_name: z.string().max(120).optional(),
  // broker-specific
  broker_mandi: z.string().max(80).optional(),
  broker_years: z.number().int().min(0).max(80).optional(),
  // buyer-specific
  buyer_company: z.string().max(120).optional(),
  buyer_gst: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/, 'invalid GSTIN')
    .optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;

/** Returned when the user first verifies OTP — only the bare minimum is set. */
export const UserShellSchema = UserSchema.pick({
  _id: true,
  phone: true,
  role: true,
  created_at: true,
  updated_at: true,
}).extend({
  name: z.string().optional(),
});
export type UserShell = z.infer<typeof UserShellSchema>;

/** PATCH /me — owner can update profile fields (role and kyc are locked here). */
export const UpdateMeInputSchema = z
  .object({
    name: z.string().min(1).max(80),
    location: UserLocationSchema,
    business_name: z.string().max(120),
    broker_mandi: z.string().max(80),
    broker_years: z.number().int().min(0).max(80),
    buyer_company: z.string().max(120),
    buyer_gst: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/),
  })
  .partial();
export type UpdateMeInput = z.infer<typeof UpdateMeInputSchema>;

/** Admin-only KYC decision payload. */
export const AdminKycDecisionInputSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  reason: z.string().max(280).optional(),
});
export type AdminKycDecisionInput = z.infer<typeof AdminKycDecisionInputSchema>;

// ---------- Auth flow ----------

export const OtpSendInputSchema = z.object({ phone: PhoneSchema });
export type OtpSendInput = z.infer<typeof OtpSendInputSchema>;

export const OtpVerifyInputSchema = z.object({
  phone: PhoneSchema,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  /** When first verifying, the new user needs a role. */
  role: RoleSchema.optional(),
});
export type OtpVerifyInput = z.infer<typeof OtpVerifyInputSchema>;
