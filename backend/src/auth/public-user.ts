import { User } from '@prisma/client';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
