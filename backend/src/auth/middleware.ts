import { NextFunction, Request, Response } from 'express';
import { prisma } from '../db';
import { AUTH_COOKIE_NAME } from './cookie';
import { verifyToken } from './jwt';

/**
 * Express middleware that rejects requests without a valid auth cookie, otherwise attaches `req.user`.
 * Beyond verifying the JWT signature, this also checks the session it references still exists server-side
 * (so logout/revocation actually takes effect) and that the user hasn't been soft-deleted — the role is
 * read fresh from the database rather than trusted from the token, so a role change also takes effect immediately.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date() || session.user.deletedAt) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  req.user = { sub: session.userId, role: session.user.role, sessionId: session.id };
  next();
}

/** Returns middleware that rejects (403) requests from an authenticated user whose role doesn't match. Must run after {@link requireAuth}. */
export function requireRole(role: 'ADMIN' | 'USER') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
