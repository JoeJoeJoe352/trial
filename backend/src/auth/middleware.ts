import { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE_NAME } from './cookie';
import { verifyToken } from './jwt';

/** Express middleware that rejects requests without a valid auth cookie, otherwise attaches `req.user`. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
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
