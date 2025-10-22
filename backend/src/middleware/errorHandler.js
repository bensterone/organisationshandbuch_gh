module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Log full stack for server diagnostics
  console.error('❌ Error:', err.stack || err);

  // Known DB errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate entry', details: 'Resource already exists' });
  }

  // Known validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', details: err.message });
  }

  // Fallback
  res.status(status).json({
    error: isProd ? 'Internal Server Error' : (err.message || 'Internal server error')
  });
};
