import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

/** Shared Prisma client for the app, using the `pg` driver adapter. */
export const prisma = new PrismaClient({ adapter });
