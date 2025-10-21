const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { login, getProfile } = require('../services/auth.service');

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const result = await login(username, password);
    if (!result) return res.status(401).json({ error: 'Invalid credentials' });
    res.json(result);
  } catch (e) { next(e); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const me = await getProfile(req.user.id);
    res.json(me || {});
  } catch (e) { next(e); }
});

module.exports = router;
