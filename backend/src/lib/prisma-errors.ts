import { Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Maps common Prisma error codes to the right HTTP response.
 * Returns true if it handled the error (caller should stop), false otherwise (caller should rethrow).
 */
export function handlePrismaError(err: unknown, res: Response): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'A record with this value already exists' });
      return true;
    }
    if (err.code === 'P2003') {
      res.status(400).json({ error: 'Referenced record does not exist' });
      return true;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Not found' });
      return true;
    }
  }
  return false;
}
