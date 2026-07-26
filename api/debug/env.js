module.exports = function handler(req, res) {
  res.status(200).json({
    SUPABASE_URL:              !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET:                !!process.env.JWT_SECRET,
    STRIPE_SECRET_KEY:         !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET:     !!process.env.STRIPE_WEBHOOK_SECRET,
  });
};
