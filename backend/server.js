const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pool = require('./db');
const { rateLimit } = require('./middleware/rateLimit');
const PublicUploads = require('./storage/publicUploadStore');

const adminRoutes = require('./routes/adminRoutes');
const barberRoutes = require('./routes/barberRoutes');
const receptionistRoutes = require('./routes/receptionistRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/servicesRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const platformRoutes = require('./routes/platformRoutes');
const deskFinanceRoutes = require('./routes/deskFinanceRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

const app = express();
const production = process.env.NODE_ENV === 'production';
const clientDirectory = path.resolve(__dirname, '..', 'frontend', 'dist');
const clientIndex = path.join(clientDirectory, 'index.html');
const browserRoutes = ['/admin', '/barber', '/receptionist', '/ratings', '/auth', '/services', '/appointments', '/public', '/platform', '/uploads', '/health'];
const wholeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
const configuredOrigins = String(process.env.CORS_ORIGIN || process.env.PUBLIC_APP_URL || '')
  .split(',').map(value => value.trim()).filter(Boolean);
const allowedOrigins = new Set(configuredOrigins);
if (!production) ['http://127.0.0.1:5173', 'http://localhost:5173'].forEach(origin => allowedOrigins.add(origin));

if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  if (production && req.secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    callback(new Error('This origin is not allowed to call the Mirror API.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86400,
}));
app.use(rateLimit({ windowMs: 60 * 1000, max: wholeNumber(process.env.RATE_LIMIT_PER_MINUTE, 600), scope: 'global' }));
app.use(express.json({ limit: '256kb', strict: true }));
app.get(/^\/uploads\/(.+)$/, async (req, res, next) => {
  try {
    const file = await PublicUploads.read(req.params[0]);
    if (!file) return res.status(404).json({ error: 'Image not found.' });
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', production ? 'public, max-age=604800, immutable' : 'no-store');
    if (file.contentLength) res.setHeader('Content-Length', String(file.contentLength));
    file.stream.on('error', next);
    file.stream.pipe(res);
  } catch (error) { next(error); }
});

if (!production) app.get('/', (_req, res) => res.json({ service: 'Mirror API', status: 'ok' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/health/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/admin', adminRoutes);
app.use('/admin', subscriptionRoutes.admin);
app.use('/admin', deskFinanceRoutes.admin);
app.use('/admin', require('./routes/ownerRoutes'));
app.use('/barber', barberRoutes);
app.use('/receptionist', receptionistRoutes);
app.use('/receptionist', deskFinanceRoutes.reception);
app.use('/ratings', ratingRoutes);
app.use('/auth', authRoutes);
app.use('/services', serviceRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/public', publicRoutes);
app.use('/platform', platformRoutes);
app.use('/platform', subscriptionRoutes.platform);

if (production && fs.existsSync(clientIndex)) {
  app.use(express.static(clientDirectory, { index: false, maxAge: '1h', fallthrough: true }));
}
app.use((req, res) => {
  const isApiRoute = browserRoutes.some(prefix => req.path === prefix || req.path.startsWith(`${prefix}/`));
  if (production && !isApiRoute && req.method === 'GET' && fs.existsSync(clientIndex)) return res.sendFile(clientIndex);
  res.status(404).json({ error: 'Route not found.' });
});
app.use((error, req, res, _next) => {
  const uploadProblem = error?.name === 'MulterError' || error?.code === 'LIMIT_FILE_SIZE';
  const corsProblem = error?.message === 'This origin is not allowed to call the Mirror API.';
  const status = corsProblem ? 403 : uploadProblem || error instanceof SyntaxError ? 400 : error?.status === 404 ? 404 : 500;
  if (status === 500) console.error(`Unhandled API error on ${req.method} ${req.originalUrl}:`, error?.message || error);
  res.status(status).json({ error: corsProblem ? error.message : uploadProblem ? 'Uploaded image must be 2 MB or smaller.' : status === 404 ? 'Resource not found.' : 'Unable to process this request. Please try again.' });
});

const PORT = process.env.PORT || 5000;
// Managed hosts such as Alet Cloud reach the process through the container
// network, so production must not bind only to loopback. Local development
// keeps the existing private address unless HOST is set explicitly.
const HOST = process.env.HOST || (production ? '0.0.0.0' : '127.0.0.1');
if (require.main === module) {
  if (production && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'secretkey' || process.env.JWT_SECRET.length < 32)) {
    throw new Error('Set a unique JWT_SECRET of at least 32 characters before starting Mirror in production.');
  }
  if (production && !allowedOrigins.size) throw new Error('Set CORS_ORIGIN to the browser origin before starting Mirror in production.');
  const server = app.listen(PORT, HOST, () => {
    const stopTasks = [
      require('./models/deskFinanceModel').startDailyClock(),
      require('./models/telegramModel').start(),
      require('./models/platformEventModel').start(),
    ];
    let shuttingDown = false;
    const shutdown = signal => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`${signal} received; closing Mirror safely.`);
      stopTasks.forEach(stop => stop?.());
      server.close(() => pool.end().finally(() => process.exit(0)));
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    console.log(`Mirror API listening on http://${HOST}:${PORT}`);
  });
  // Bound slow connections as well as request rates. These values leave enough
  // room for the allowed image uploads while releasing stalled sockets quickly.
  server.requestTimeout = 30000;
  server.headersTimeout = 35000;
  server.keepAliveTimeout = 5000;
}

module.exports = app;
