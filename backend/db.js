require('./config');
const { Pool } = require('pg');

const production = process.env.NODE_ENV === 'production';
const wholeNumber = (value, fallback, minimum = 1) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback;
};
const statementTimeout = wholeNumber(process.env.PG_STATEMENT_TIMEOUT_MS, 15000);
const lockTimeout = wholeNumber(process.env.PG_LOCK_TIMEOUT_MS, 5000);
const poolMax = wholeNumber(process.env.PGPOOL_MAX, production ? 20 : 10);
const poolMin = Math.min(wholeNumber(process.env.PGPOOL_MIN, 0, 0), poolMax);
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: wholeNumber(process.env.PGPORT, 5432),
  database: process.env.PGDATABASE || 'barberbook',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  max: poolMax,
  min: poolMin,
  idleTimeoutMillis: wholeNumber(process.env.PG_IDLE_TIMEOUT_MS, 30000),
  connectionTimeoutMillis: wholeNumber(process.env.PG_CONNECTION_TIMEOUT_MS, 5000),
  query_timeout: statementTimeout,
  maxUses: wholeNumber(process.env.PG_MAX_USES, 7500),
  keepAlive: true,
  application_name: process.env.PGAPPNAME || 'mirror-api',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
  options: process.env.PGOPTIONS || `-c statement_timeout=${statementTimeout} -c lock_timeout=${lockTimeout}`,
});

pool.on('error', error => console.error('PostgreSQL pool error:', error.message));

module.exports = pool;
