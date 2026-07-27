const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'lumi_portal_token';
const TOKEN_EXPIRY = '12h';

function signPortalToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyPortalToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function getPortalCookieHeader(token) {
  const maxAge = 12 * 60 * 60;
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

function clearPortalCookieHeader() {
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

function requirePortal(handler) {
  return async function (req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ error: 'Login necessário.' });
    }

    let payload;
    try {
      payload = verifyPortalToken(token);
    } catch {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }

    // Garante que client_id sempre vem do token, nunca da query/body
    req.portalUser = payload;
    return handler(req, res);
  };
}

module.exports = { signPortalToken, getPortalCookieHeader, clearPortalCookieHeader, parseCookies, requirePortal, COOKIE_NAME };
