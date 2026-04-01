const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('[migrate] Skipping — no Supabase credentials');
    return { ran: 0, pending: [] };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check if _migrations table exists by trying to read from it
  const { data: existing, error: checkErr } = await supabase
    .from('_migrations')
    .select('name');

  const executedMigrations = checkErr ? [] : (existing || []).map(m => m.name);

  if (checkErr) {
    console.log('[migrate] _migrations table not found — run initial setup via /api/migrate endpoint');
  }

  // Read migration files
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  const pending = files.filter(f => !executedMigrations.includes(f));

  if (pending.length > 0) {
    console.log(`[migrate] ${pending.length} pending migration(s): ${pending.join(', ')}`);
  } else {
    console.log('[migrate] All migrations up to date');
  }

  return { ran: executedMigrations.length, pending };
}

function getMigrationSQL() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  const allSQL = [];

  // First ensure _migrations table exists
  allSQL.push(`CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    allSQL.push(`-- === ${file} ===`);
    allSQL.push(sql);
    allSQL.push(`INSERT INTO _migrations (name) VALUES ('${file}') ON CONFLICT (name) DO NOTHING;`);
  }

  return allSQL.join('\n\n');
}

module.exports = { runMigrations, getMigrationSQL };
