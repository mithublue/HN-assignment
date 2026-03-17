const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  const url = process.env.DATABASE_URL;
  console.log('Testing connection to:', url.replace(/:[^:@]+@/, ':****@'));
  
  try {
    const connection = await mysql.createConnection(url);
    console.log('✅ Successfully connected to MySQL server!');
    await connection.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('Suggestion: Check your username and password.');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.log('Suggestion: Check if the remote host allows connections from your IP address.');
    }
  }
}

testConnection();
