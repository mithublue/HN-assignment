// Quick test to verify database connection
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasource: {
    url: process.env.DATABASE_URL
  }
});

async function main() {
  try {
    console.log('Testing database connection...');

    // Try to connect
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Try to query
    const count = await prisma.bookmark.count();
    console.log(`✅ Database query successful. Bookmarks: ${count}`);

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
