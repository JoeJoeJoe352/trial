import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';

/** Claims stored in the auth JWT: the user id (`sub`) and their role. */
export interface JwtPayload {
  sub: string;
  role: 'ADMIN' | 'USER';
}

/** Signs a {@link JwtPayload} into a JWT valid for {@link JWT_EXPIRES_IN}. */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/** Verifies and decodes a JWT, throwing if it's invalid or expired. */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
