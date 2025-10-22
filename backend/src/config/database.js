// backend/src/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'organisationshandbuch',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  timezone: '+00:00',
  // multipleStatements: false, // default; keep disabled for safety
});

/**
 * Simple helper that always sends an array of params and uses .query()
 * (more tolerant for dynamic SQL like interpolated LIMITs).
 */
async function query(sql, params = []) {
  const bind = Array.isArray(params) ? params : [params];
  const [rows] = await pool.query(sql, bind);
  return rows;
}

async function getConnection() {
  return pool.getConnection();
}

async function testConnection() {
  try {
    await query('SELECT 1');
    console.log('✅ Database connected');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

module.exports = { pool, query, getConnection, testConnection };
