const crypto = require('crypto');
const { query } = require('../config/database');

const hashIp = (ip) => {
  const secret = process.env.IP_HASH_SECRET || 'change-this-secret';
  return crypto.createHmac('sha256', secret).update(ip || '').digest('hex');
};

module.exports = function accessLog() {
  return async (req, res, next) => {
    const start = Date.now();
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    res.on('finish', async () => {
      try {
        // Respect opt-out for analytics/logging via consent
        const userId = req.user?.id || null;
        const status = res.statusCode || 0;

        await query(
          `INSERT INTO data_access_logs (user_id, method, path, status, ip_hash)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, req.method, req.originalUrl.slice(0, 250), status, hashIp(ip)]
        );
      } catch (_) { /* swallow */ }
    });
    next();
  };
};
