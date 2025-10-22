const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

router.get('/', authenticate, async (_req, res, next) => {
  try {
    const docsRows  = await query('SELECT COUNT(*) AS c FROM documents');
    const procsRows = await query('SELECT COUNT(*) AS c FROM processes');
    const filesRows = await query('SELECT COUNT(*) AS c FROM files');

    const documents = (docsRows[0]?.c)  ?? 0;
    const processes = (procsRows[0]?.c) ?? 0;
    const files     = (filesRows[0]?.c) ?? 0;

    res.json({ documents, processes, files });
  } catch (e) { next(e); }
});

module.exports = router;
