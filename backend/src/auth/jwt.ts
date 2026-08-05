import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

/** How long a session (and the JWT referencing it) stays valid. Single source of truth for both. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Claims stored in the auth JWT: the user id (`sub`), their role, and the server-side {@link Session} it's tied to. */
export interface JwtPayload {
  sub: string;
  role: 'ADMIN' | 'USER';
  sessionId: string;
}

/** Signs a {@link JwtPayload} into a JWT valid for {@link SESSION_TTL_MS}. */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_TTL_MS / 1000 });
}

/** Verifies and decodes a JWT, throwing if it's invalid or expired. */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
