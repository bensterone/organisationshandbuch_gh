exports.ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
exports.fail = (res, error, status = 400, details = undefined) =>
  res.status(status).json({ success: false, error, ...(details ? { details } : {}) });
