import type { FastifyInstance } from 'fastify';
import { UserModel } from '@anaaj/db';
import { OtpSendInputSchema, OtpVerifyInputSchema, type Role, RoleSchema } from '@anaaj/types';
import { parseOrThrow } from '../lib/zod.js';
import { fail, ok } from '../lib/reply.js';
import { sendOtp, verifyOtp } from '../services/otp.js';
import { clearSessionCookie, setSessionCookie } from '../services/cookie.js';

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    '/auth/otp/send',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const { phone } = parseOrThrow(OtpSendInputSchema, req.body);
      try {
        await sendOtp(app.redis, phone);
      } catch (err) {
        if (
          err instanceof Error &&
          'code' in err &&
          (err as { code: string }).code === 'otp_rate_limited'
        ) {
          return fail(reply, 429, 'otp_rate_limited', err.message);
        }
        throw err;
      }
      return ok(reply, { sent: true, phone, dev_hint: 'OTP 123456 is accepted in dev' });
    },
  );

  app.post('/auth/otp/verify', async (req, reply) => {
    const body = parseOrThrow(OtpVerifyInputSchema, req.body);
    await verifyOtp(app.redis, body.phone, body.otp);

    let user = await UserModel.findOne({ phone: body.phone });
    let isNewUser = false;
    if (!user) {
      // First-time verification — role is required to materialize the user shell.
      const roleParsed = RoleSchema.safeParse(body.role);
      if (!roleParsed.success) {
        return fail(
          reply,
          400,
          'role_required',
          'role is required when verifying for the first time',
        );
      }
      user = await UserModel.create({ phone: body.phone, role: roleParsed.data });
      isNewUser = true;
    }

    const role = user.role as Role;
    const userId = String(user._id);
    const token = app.jwt.sign({ sub: userId, role, phone: user.phone });
    setSessionCookie(reply, token);

    return ok(reply, {
      user: {
        _id: userId,
        phone: user.phone,
        name: user.name ?? null,
        role,
        kyc: user.kyc ?? { status: 'pending' },
      },
      is_new_user: isNewUser,
    });
  });

  app.post('/auth/logout', { preHandler: [app.authenticate] }, async (_req, reply) => {
    clearSessionCookie(reply);
    return ok(reply, { logged_out: true });
  });
}
