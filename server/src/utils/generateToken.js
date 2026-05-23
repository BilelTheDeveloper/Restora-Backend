import jwt from 'jsonwebtoken';

const isProd = process.env.NODE_ENV === 'production';

// Access token — short-lived, returned in response body, stored in memory on client
export const generateAccessToken = (id) =>
  jwt.sign({ id, type: 'access' }, process.env.JWT_SECRET, { expiresIn: '15m' });

// Refresh token — long-lived, stored in httpOnly cookie only
export const generateRefreshToken = (id) =>
  jwt.sign({ id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', {
    expiresIn: '7d',
  });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');

// ── Cookie helpers ─────────────────────────────────────────
const COOKIE_NAME = 'restora_refresh';

const cookieOpts = {
  httpOnly:  true,
  secure:    isProd,
  sameSite:  isProd ? 'None' : 'Lax',
  path:      '/api/auth',          // only sent to auth endpoints
  maxAge:    7 * 24 * 60 * 60 * 1000,
};

export const setRefreshCookie = (res, token) =>
  res.cookie(COOKIE_NAME, token, cookieOpts);

export const clearRefreshCookie = (res) =>
  res.clearCookie(COOKIE_NAME, { ...cookieOpts, maxAge: 0 });

export const getRefreshCookie = (req) => req.cookies?.[COOKIE_NAME];

// Legacy — kept so existing imports don't break while migrating
export default generateAccessToken;
