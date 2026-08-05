import { Role } from '@prisma/client';
import { prisma } from '../db';
import { signToken, SESSION_TTL_MS } from './jwt';

/** Creates a server-side session for a user and returns a signed JWT referencing it. Call on register/login. */
export async function createSession(userId: string, role: Role): Promise<string> {
  const session = await prisma.session.create({
    data: { userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  return signToken({ sub: userId, role, sessionId: session.id });
}

/** Deletes a session by id, revoking the JWT that references it. No-ops if it's already gone. */
export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}
