const { getDb } = require('../_lib/db');

module.exports = async function handler(req, res) {
  const v = (name) => ({
    exists: !!process.env[name],
    length: process.env[name] ? process.env[name].length : 0,
  });

  const envReport = {
    SUPABASE_URL:              v('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: v('SUPABASE_SERVICE_ROLE_KEY'),
    JWT_SECRET:                v('JWT_SECRET'),
    STRIPE_SECRET_KEY:         v('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET:     v('STRIPE_WEBHOOK_SECRET'),
    NODE_ENV:                  process.env.NODE_ENV || 'undefined',
    VERCEL_ENV:                process.env.VERCEL_ENV || 'undefined',
    VERCEL_GIT_COMMIT_SHA:     (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 10) || 'undefined',
  };

  // Test Supabase connection — only returns aggregate counts, no user data
  let dbReport = {};
  try {
    const db = getDb();
    const { count, error } = await db
      .from('lumi_admin_users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      dbReport = { connected: false, error: error.message };
    } else {
      dbReport = {
        connected: true,
        table_lumi_admin_users_exists: true,
        admin_user_count: count,
      };
    }
  } catch (e) {
    dbReport = { connected: false, error: e.message };
  }

  res.status(200).json({ env: envReport, db: dbReport });
};
