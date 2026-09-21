const windows = new Map();

const clientIp = req => String(req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 120);

// Dependency-free, bounded fixed-window limiter. It stops repeated requests
// before they reach authentication or the database.
function rateLimit({ windowMs, max, key = clientIp, scope = 'route', message = 'Too many requests. Please try again shortly.' }) {
  if (!Number.isInteger(windowMs) || windowMs < 1000 || !Number.isInteger(max) || max < 1) throw new Error('Invalid rate limit configuration.');
  if (!['route', 'global'].includes(scope)) throw new Error('Invalid rate limit scope.');
  return (req, res, next) => {
    const now = Date.now();
    // Global limits protect the server as a whole. Route limits, used for
    // sign-in and trial creation, protect expensive entry points.
    const bucketKey = scope === 'global'
      ? `global:${key(req)}`
      : `${req.baseUrl || ''}:${req.path}:${key(req)}`;
    let bucket = windows.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      // Keep attacker-controlled client keys from expanding process memory.
      if (!windows.has(bucketKey) && windows.size >= 50000) windows.delete(windows.keys().next().value);
      windows.set(bucketKey, bucket);
    }
    bucket.count += 1;
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: message, retryAfter });
    }
    next();
  };
}

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of windows) if (bucket.resetAt <= now) windows.delete(key);
  if (windows.size > 50000) windows.clear();
}, 60 * 1000);
cleanup.unref();

module.exports = { rateLimit };
