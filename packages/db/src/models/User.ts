import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const kycSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      required: true,
    },
    gst: { type: String },
    pan_last4: { type: String },
    aadhaar_last4: { type: String },
    verified_at: { type: Date },
  },
  { _id: false },
);

const userLocationSchema = new Schema(
  {
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    geo: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (v: number[]) => v.length === 2,
          message: 'coordinates must be [lng, lat]',
        },
      },
    },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^\+91[6-9]\d{9}$/,
    },
    name: { type: String, maxlength: 80 },
    role: {
      type: String,
      enum: ['seller', 'broker', 'buyer', 'admin'],
      required: true,
    },
    kyc: { type: kycSchema, default: () => ({ status: 'pending' }) },
    location: { type: userLocationSchema },
    business_name: { type: String, maxlength: 120 },
    // role-specific
    broker_mandi: { type: String, maxlength: 80 },
    broker_years: { type: Number, min: 0, max: 80 },
    buyer_company: { type: String, maxlength: 120 },
    buyer_gst: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'users',
  },
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const UserModel: Model<UserDoc> = model<UserDoc>('User', userSchema);
