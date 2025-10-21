const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

// Simple login (replace with LDAP in production)
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const users = await query(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // For demo: accept any password for 'admin'
    // In production: use LDAP or bcrypt password check
    if (username !== 'admin') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      accessToken: token
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json(req.user);
});

module.exports = router;