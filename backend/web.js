require('./config');

const app = require('./server');
const pool = require('./db');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'secretkey' || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set a unique JWT_SECRET of at least 32 characters before starting Mirror in production.');
  }
  if (!String(process.env.CORS_ORIGIN || process.env.PUBLIC_APP_URL || '').trim()) {
    throw new Error('Set CORS_ORIGIN to the browser origin before starting Mirror in production.');
  }
}

const server = app.listen(PORT, HOST, () => console.log(`Mirror API listening on http://${HOST}:${PORT}`));
server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.keepAliveTimeout = 5_000;

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; closing Mirror safely.`);
  server.close(() => pool.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
