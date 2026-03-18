/**
 * Prisma Client Configuration
 * 
 * This file sets up the Prisma database client with MySQL adapter for Prisma 7.
 * 
 * Key concepts:
 * - Prisma 7 requires a driver adapter instead of built-in drivers
 * - We use @prisma/adapter-mariadb which works with MySQL
 * - Connection pooling is configured for optimal performance
 * - Global singleton pattern prevents multiple client instances in development
 * 
 * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Global type augmentation for Prisma client
 * Allows us to store the client on globalThis in development
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Creates a new Prisma Client instance with MySQL adapter
 * 
 * The adapter pattern:
 * 1. Creates a MySQL connection pool using @prisma/adapter-mariadb
 * 2. Passes the adapter to PrismaClient constructor
 * 3. Prisma uses the adapter to execute queries
 * 
 * Connection configuration:
 * - host: MySQL server hostname (from env)
 * - port: MySQL server port (default 3306)
 * - user: Database username
 * - password: Database password
 * - database: Database name
 * - connectionLimit: Max number of connections in pool (5 is good for most apps)
 * 
 * @returns Configured PrismaClient instance
 */
function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'hackernews',
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

/**
 * Singleton Prisma Client instance
 * 
 * In development:
 * - Reuses the same client across hot reloads
 * - Prevents "too many connections" errors
 * 
 * In production:
 * - Creates a single client instance
 * - Optimizes connection pooling
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

/**
 * Store client globally in development
 * This prevents creating new clients on every hot reload
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
