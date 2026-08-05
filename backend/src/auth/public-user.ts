import { User } from '@prisma/client';

/** User fields safe to expose over the API — notably excludes `passwordHash`. */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

/** Strips sensitive fields (e.g. `passwordHash`) from a Prisma {@link User} before sending it to a client. */
export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
