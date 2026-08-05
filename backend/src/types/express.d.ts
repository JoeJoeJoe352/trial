import { JwtPayload } from '../auth/jwt';

declare global {
  namespace Express {
    /** Augments Express's Request with the decoded JWT payload set by {@link requireAuth}. */
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
