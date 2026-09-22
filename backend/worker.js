require('./config');

const pool = require('./db');
const Finance = require('./models/deskFinanceModel');
const Telegram = require('./models/telegramModel');
const PlatformEvents = require('./models/platformEventModel');

const tasks = [
  Finance.startDailyClock(),
  Telegram.start(),
  PlatformEvents.start(),
];

// The individual schedulers use unref'd timers so they do not prevent a web
// process from exiting. A dedicated worker needs one referenced handle to
// remain alive and to keep processing scheduled business events.
const keepAlive = setInterval(() => {}, 60_000);
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; stopping Mirror worker safely.`);
  clearInterval(keepAlive);
  tasks.forEach(stop => stop?.());
  pool.end().finally(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
console.log('Mirror worker is processing scheduled business tasks.');
