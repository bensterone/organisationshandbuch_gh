const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  timezone: '+00:00'
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

const query = async (sql, params = []) => {
  const [results] = await pool.execute(sql, params);
  return results;
};

const getConnection = async () => {
  return await pool.getConnection();
};

module.exports = { pool, query, getConnection, testConnection };