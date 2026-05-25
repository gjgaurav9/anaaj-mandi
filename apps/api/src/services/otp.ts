import type Redis from 'ioredis';
import { env } from '../config.js';

const OTP_TTL_SECONDS = 5 * 60; // 5 min
const OTP_RATE_KEY_TTL = 60 * 60; // 1 hour window
const OTP_RATE_MAX = 5;

const otpKey = (phone: string) => `otp:code:${phone}`;
const rateKey = (phone: string) => `otp:rate:${phone}`;

/** Random 6-digit OTP as a zero-padded string. */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class OtpRateLimitError extends Error {
  readonly code = 'otp_rate_limited';
  readonly status = 429;
  constructor() {
    super('Too many OTP requests. Try again later.');
  }
}

export class OtpInvalidError extends Error {
  readonly code = 'otp_invalid';
  readonly status = 401;
  constructor() {
    super('Invalid or expired OTP.');
  }
}

/**
 * Generates an OTP, stores it under `otp:code:{phone}` with TTL, and
 * increments the per-phone hourly request counter. Throws OtpRateLimitError
 * if the counter exceeds OTP_RATE_MAX in the window.
 *
 * Returns the OTP so the caller (dev mode) can log it.
 */
export async function sendOtp(redis: Redis, phone: string): Promise<string> {
  const count = await redis.incr(rateKey(phone));
  if (count === 1) await redis.expire(rateKey(phone), OTP_RATE_KEY_TTL);
  if (count > OTP_RATE_MAX) throw new OtpRateLimitError();

  const otp = generateOtp();
  await redis.set(otpKey(phone), otp, 'EX', OTP_TTL_SECONDS);

  // In dev we don't actually call Twilio — the user types 123456 anyway.
  // Logging the real OTP here is useful for end-to-end tests that don't
  // want the bypass.
  if (env.OTP_DEV_BYPASS) {
    console.log(`[otp] dev send → phone=${phone} otp=${otp} (bypass also accepts 123456)`);
  } else {
    // TODO(step 4.1): real Twilio Verify call goes here when OTP_DEV_BYPASS=false
    // and account credentials are present.
    console.log(`[otp] would have sent ${otp} to ${phone} via Twilio Verify`);
  }
  return otp;
}

/**
 * Verifies an OTP for a phone. With OTP_DEV_BYPASS=true, the literal "123456"
 * is always accepted. Otherwise the OTP must match what's in Redis (and
 * hasn't expired). Successful verification consumes the OTP.
 */
export async function verifyOtp(redis: Redis, phone: string, otp: string): Promise<boolean> {
  if (env.OTP_DEV_BYPASS && otp === '123456') return true;
  const stored = await redis.get(otpKey(phone));
  if (!stored || stored !== otp) throw new OtpInvalidError();
  await redis.del(otpKey(phone));
  return true;
}
