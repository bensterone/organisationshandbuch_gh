const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken } = require('../utils/jwt');

// POST /api/auth/login
// Accepts: { username?, email?, password }
router.post('/login', async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};

    const identifier = (username || email || '').trim();
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    // Look up by username OR email
    const users = await query(
      `SELECT id, username, email, full_name, role, is_active, password_hash
       FROM users
       WHERE (username = ? OR email = ?) LIMIT 1`,
      [identifier, identifier]
    );

    const user = users[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = generateToken(payload);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
      },
      token,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    // this route should be protected by authenticate middleware in server mount
    // but we defensively handle missing req.user
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    res.json(req.user);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
