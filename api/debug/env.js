module.exports = function handler(req, res) {
  const v = (name) => ({
    exists: !!process.env[name],
    length: process.env[name] ? process.env[name].length : 0,
  });

  res.status(200).json({
    SUPABASE_URL:              v('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: v('SUPABASE_SERVICE_ROLE_KEY'),
    JWT_SECRET:                v('JWT_SECRET'),
    STRIPE_SECRET_KEY:         v('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET:     v('STRIPE_WEBHOOK_SECRET'),
    NODE_ENV:                  process.env.NODE_ENV || 'undefined',
    VERCEL_ENV:                process.env.VERCEL_ENV || 'undefined',
    VERCEL_GIT_COMMIT_SHA:     (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 10) || 'undefined',
  });
};
