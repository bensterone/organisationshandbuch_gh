const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken } = require('../utils/jwt');

async function getUserByUsername(username) {
  const rows = await query(
    `SELECT id, username, password_hash, full_name, role
     FROM users WHERE username = ? LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

async function login(username, password, jwtExpiresIn = process.env.JWT_EXPIRES_IN || '8h') {
  const user = await getUserByUsername(username);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash || '');
  if (!ok) return null;
  const token = generateToken({ id: user.id, username: user.username, role: user.role }, jwtExpiresIn);
  return { user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role }, token };
}

async function getProfile(userId) {
  const rows = await query(
    `SELECT id, username, full_name, role, created_at
     FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

module.exports = { getUserByUsername, login, getProfile };
