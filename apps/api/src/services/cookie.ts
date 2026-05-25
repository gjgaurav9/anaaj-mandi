import type { FastifyReply } from 'fastify';
import { env } from '../config.js';

const cookieOptions = (maxAgeSeconds: number) => ({
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: maxAgeSeconds,
});

const JWT_TTL_SECONDS = env.JWT_TTL_DAYS * 24 * 60 * 60;

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(env.JWT_COOKIE_NAME, token, cookieOptions(JWT_TTL_SECONDS));
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(env.JWT_COOKIE_NAME, { path: '/' });
}
