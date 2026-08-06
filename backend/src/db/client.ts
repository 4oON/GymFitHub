/**
 * Prisma Database Client
 *
 * Singleton instance of PrismaClient for database operations.
 * Configured to log errors and warnings for debugging.
 *
 * Usage:
 * import prisma from './db/client';
 * const users = await prisma.user.findMany();
 */
import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL || '';
console.log(`[DB] Initializing Prisma with URL: ${url.replace(/:.*@/, ':****@')}`);

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

prisma.$connect()
  .then(() => console.log('[DB] Database connected successfully'))
  .catch((err) => console.error('[DB] Database connection failed:', err.message));

export default prisma;
