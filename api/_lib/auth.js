const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'lumi_admin_token';
const TOKEN_EXPIRY = '8h';

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function getCookieHeader(token) {
  const maxAge = 8 * 60 * 60; // 8 hours in seconds
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

function getClearCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...v] = c.trim().split('=');
      return [key.trim(), v.join('=').trim()];
    })
  );
}

function requireAdmin(handler) {
  return async function (req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    req.admin = payload;
    return handler(req, res);
  };
}

module.exports = { signToken, verifyToken, getCookieHeader, getClearCookieHeader, parseCookies, requireAdmin, COOKIE_NAME };
