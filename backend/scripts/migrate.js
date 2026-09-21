const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcrypt');
require('../config');
const pool = require('../db');

async function applyMigration(name, sql) {
  // PostgreSQL does not permit several CREATE INDEX CONCURRENTLY statements in
  // one protocol command. This migration deliberately keeps those index builds
  // non-blocking for a live shop, so send each simple statement separately.
  if (name === '018_performance_indexes.sql') {
    for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map(value => value.trim()).filter(Boolean)) {
      await pool.query(statement);
    }
    return;
  }
  await pool.query(sql);
}

async function migrate() {
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT NOW())');
  const directory = path.join(__dirname, '..', 'migrations');
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith('.sql')).sort()) {
    if ((await pool.query('SELECT name FROM schema_migrations WHERE name=$1', [name])).rowCount) continue;
    await applyMigration(name, fs.readFileSync(path.join(directory, name), 'utf8'));
    await pool.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
    console.log(`Applied ${name}`);
  }
  const password = await bcrypt.hash(process.env.PLATFORM_ADMIN_PASSWORD || 'Platform123', 10);
  await pool.query(
    `INSERT INTO users (name, email, role, password, shop_id)
     VALUES ($1, $2, 'platform_admin', $3, NULL)
     ON CONFLICT (email) DO NOTHING`,
    ['Platform Admin', process.env.PLATFORM_ADMIN_EMAIL || 'platform@mirror.local', password]
  );
  console.log('Mirror SaaS operations migration complete.');
}

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => pool.end());
