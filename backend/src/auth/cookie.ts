import { CookieOptions } from 'express';

/** Name of the cookie that carries the auth JWT. */
export const AUTH_COOKIE_NAME = 'token';

/** Cookie options used when setting the auth cookie on login/register. */
export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  // Only true once there's TLS termination in front of this service (e.g. behind an HTTPS
  // load balancer) — NODE_ENV=production alone doesn't imply the traffic is HTTPS.
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};
