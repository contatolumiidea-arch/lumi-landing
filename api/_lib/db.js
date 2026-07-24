const { createClient } = require('@supabase/supabase-js');

let client = null;

function getDb() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.');
  }

  client = createClient(url, key, {
    auth: { persistSession: false }
  });

  return client;
}

module.exports = { getDb };
